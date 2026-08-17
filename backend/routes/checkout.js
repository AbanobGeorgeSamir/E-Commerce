const express = require('express');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Order = require('../models/Order');
const auth = require('../middleware/authMiddleware');
const { normalizeOrder } = require('../utils/responses');
const { isSafeDataImage } = require('../utils/images');

const router = express.Router();
const TAX_RATE = 0.05;
const SHIPPING_FEE = 15;
const FREE_SHIPPING_THRESHOLD = 500;

const firstDefined = (...values) => values.find((value) => value !== undefined && value !== null);

const createValidationError = (errors, message = 'Please review the checkout form and try again.') => {
    const error = new Error(message);
    error.statusCode = 422;
    error.validationErrors = errors;
    return error;
};

const roundCurrency = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
const validEmail = (email) => /^\S+@\S+\.\S+$/.test(email);

const parseJsonObject = (value) => {
    if (!value) return null;
    if (typeof value === 'object' && !Array.isArray(value)) return value;
    if (typeof value !== 'string') return null;

    try {
        const parsed = JSON.parse(value);
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
    } catch (error) {
        return null;
    }
};

const parseItems = (body = {}) => {
    const rawItems = firstDefined(body.items, body.orderItems, body.products);
    if (Array.isArray(rawItems)) return rawItems;
    if (typeof rawItems !== 'string') return [];

    try {
        const parsed = JSON.parse(rawItems);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
};

const normalizeShippingInput = (body = {}) => {
    const shippingAddress = parseJsonObject(body.shipping_address) || parseJsonObject(body.shippingAddress) || {};
    const street = firstDefined(body.street, body.address, shippingAddress.street, shippingAddress.address, '');
    const city = firstDefined(body.city, shippingAddress.city, '');
    const zip = firstDefined(body.zip, body.postalCode, body.postal_code, shippingAddress.zip, '');
    const name = firstDefined(body.name, body.fullName, shippingAddress.name, shippingAddress.fullName, '');
    const email = firstDefined(body.email, shippingAddress.email, '');
    const phone = firstDefined(body.phone, body.phoneNumber, body.customer_phone, shippingAddress.phone, '');

    return {
        name: String(name || '').trim(),
        email: String(email || '').trim().toLowerCase(),
        phone: String(phone || '').trim(),
        street: String(street || '').trim(),
        city: String(city || '').trim(),
        zip: String(zip || '').trim(),
        address: [street, city, zip].filter(Boolean).map((value) => String(value).trim()).join(', '),
    };
};

const collectItems = (items) => {
    const collected = new Map();

    for (const rawItem of items) {
        const productId = String(firstDefined(rawItem?.product_id, rawItem?.productId, rawItem?.id, '')).trim();
        const quantity = Number(firstDefined(rawItem?.quantity, rawItem?.qty, rawItem?.count, 1));

        if (!mongoose.isValidObjectId(productId) || !Number.isInteger(quantity) || quantity < 1) {
            throw createValidationError({
                items: ['Each checkout item must include a valid product id and a whole-number quantity.'],
            }, 'Checkout failed.');
        }

        collected.set(productId, (collected.get(productId) || 0) + quantity);
    }

    return [...collected.entries()].map(([productId, quantity]) => ({ productId, quantity }));
};

router.post('/checkout', auth, async (req, res) => {
    const items = parseItems(req.body);
    const shipping = normalizeShippingInput(req.body);
    const receiptImage = String(firstDefined(req.body.receiptImage, req.body.image, req.body.receipt, req.body.receipt_image, '') || '').trim();
    const validationErrors = {};

    if (!shipping.name) validationErrors.name = ['Full name is required.'];
    if (!shipping.email) validationErrors.email = ['Email is required.'];
    else if (!validEmail(shipping.email)) validationErrors.email = ['Please enter a valid email address.'];
    if (!shipping.phone) validationErrors.phone = ['Phone number is required.'];
    if (!shipping.street) validationErrors.street = ['Street address is required.'];
    if (!shipping.city) validationErrors.city = ['City is required.'];
    if (!receiptImage) validationErrors.image = ['Receipt or ID image is required.'];
    else if (!isSafeDataImage(receiptImage)) validationErrors.image = ['Upload a JPG, PNG, WEBP, or AVIF image smaller than 2 MB.'];
    if (!items.length) validationErrors.items = ['Checkout requires at least one item.'];

    if (Object.keys(validationErrors).length) {
        return res.status(422).json({
            message: 'Please review the checkout form and try again.',
            errors: validationErrors,
        });
    }

    const session = await mongoose.startSession();

    try {
        const requestedItems = collectItems(items);
        let order;

        await session.withTransaction(async () => {
            const orderItems = [];
            let subtotal = 0;

            for (const requestedItem of requestedItems) {
                const product = await Product.findOneAndUpdate(
                    { _id: requestedItem.productId, stock: { $gte: requestedItem.quantity } },
                    { $inc: { stock: -requestedItem.quantity } },
                    { new: true, session }
                );

                if (!product) {
                    throw createValidationError({
                        items: ['A product is unavailable or does not have enough stock.'],
                    }, 'Checkout failed.');
                }

                const price = Number(product.price);
                subtotal += price * requestedItem.quantity;
                orderItems.push({
                    product: product._id,
                    name: product.name,
                    image: product.image || null,
                    price,
                    quantity: requestedItem.quantity,
                });
            }

            subtotal = roundCurrency(subtotal);
            const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
            const tax = roundCurrency(subtotal * TAX_RATE);
            const total = roundCurrency(subtotal + shippingFee + tax);

            const createdOrder = await Order.create({
                user: req.user._id,
                items: orderItems,
                total,
                subtotal,
                shippingFee,
                tax,
                status: 'pending',
                shippingAddress: shipping,
                paymentMethod: String(firstDefined(req.body.payment_method, req.body.paymentMethod, 'Cash on Delivery')).trim(),
                receiptImage,
            }, { session });
            order = createdOrder;
        });

        const savedOrder = await Order.findById(order._id).populate('items.product', 'name image price');
        return res.status(201).json({
            message: 'Checkout completed successfully.',
            data: normalizeOrder(savedOrder),
        });
    } catch (error) {
        if (error.statusCode === 422 && error.validationErrors) {
            return res.status(422).json({ message: error.message, errors: error.validationErrors });
        }

        return res.status(500).json({ message: 'Checkout failed. Please try again.' });
    } finally {
        await session.endSession();
    }
});

module.exports = router;
