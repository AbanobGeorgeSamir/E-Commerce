const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    image: {
        type: String,
        default: null,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        validate: {
            validator: Number.isInteger,
            message: 'Quantity must be a whole number.',
        },
    },
}, { _id: true });

const shippingAddressSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    zip: { type: String, default: '', trim: true },
    address: { type: String, required: true, trim: true },
}, { _id: false });

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    items: {
        type: [orderItemSchema],
        required: true,
        validate: {
            validator: (items) => items.length > 0,
            message: 'An order requires at least one item.',
        },
    },
    total: {
        type: Number,
        required: true,
        min: 0,
    },
    subtotal: {
        type: Number,
        required: true,
        min: 0,
    },
    shippingFee: {
        type: Number,
        required: true,
        min: 0,
    },
    tax: {
        type: Number,
        required: true,
        min: 0,
    },
    status: {
        type: String,
        default: 'pending',
        trim: true,
    },
    shippingAddress: {
        type: shippingAddressSchema,
        required: true,
    },
    paymentMethod: {
        type: String,
        default: 'Cash on Delivery',
        trim: true,
    },
    receiptImage: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
});

orderSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
