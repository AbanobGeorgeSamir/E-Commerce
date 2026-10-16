const express = require('express');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const auth = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/adminMiddleware');
const { isAdminUser } = requireAdmin;
const { normalizeOrder } = require('../utils/responses');

const router = express.Router();
const ORDER_STATUS_TRANSITIONS = {
    pending: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered', 'cancelled'],
    delivered: [],
    completed: [],
    cancelled: [],
};

router.get('/orders', auth, async (req, res) => {
    try {
        const filter = isAdminUser(req.user) ? {} : { user: req.user._id };
        const orders = await Order.find(filter)
            .sort({ createdAt: -1 })
            .lean();
        const data = orders.map(normalizeOrder);

        res.set('Cache-Control', 'private, no-store');
        return res.json({ data, orders: data });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to load orders.' });
    }
});

router.get('/orders/:id', auth, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        const order = await Order.findById(req.params.id)
            .lean();

        if (!order) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        if (!isAdminUser(req.user) && String(order.user) !== String(req.user._id)) {
            return res.status(403).json({ message: 'You do not have permission to view this order.' });
        }

        res.set('Cache-Control', 'private, no-store');
        return res.json({ data: normalizeOrder(order) });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to load order.' });
    }
});

router.patch('/orders/:id/status', auth, requireAdmin, async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(404).json({ message: 'Order not found.' });
    }

    const nextStatus = typeof req.body?.status === 'string' ? req.body.status.trim().toLowerCase() : '';
    if (!Object.hasOwn(ORDER_STATUS_TRANSITIONS, nextStatus)) {
        return res.status(422).json({ message: 'Choose a supported order status.' });
    }

    const session = await mongoose.startSession();

    try {
        let failure = null;
        await session.withTransaction(async () => {
            const order = await Order.findById(req.params.id).session(session);
            if (!order) {
                failure = { statusCode: 404, message: 'Order not found.' };
                return;
            }

            const currentStatus = String(order.status || 'pending').trim().toLowerCase();
            if (currentStatus !== nextStatus && !ORDER_STATUS_TRANSITIONS[currentStatus]?.includes(nextStatus)) {
                failure = { statusCode: 409, message: 'That order status change is not allowed.' };
                return;
            }

            if (currentStatus === nextStatus) return;

            order.status = nextStatus;
            await order.save({ session });

            if (nextStatus === 'cancelled') {
                for (const item of order.items) {
                    await Product.updateOne(
                        { _id: item.product },
                        { $inc: { stock: item.quantity } },
                        { session }
                    );
                }
            }
        });

        if (failure) return res.status(failure.statusCode).json({ message: failure.message });

        const updatedOrder = await Order.findById(req.params.id).lean();
        res.set('Cache-Control', 'private, no-store');
        return res.json({ message: 'Order status updated.', data: normalizeOrder(updatedOrder) });
    } catch (error) {
        if (error?.statusCode) return res.status(error.statusCode).json({ message: error.message });
        return res.status(500).json({ message: 'Failed to update order status.' });
    } finally {
        await session.endSession();
    }
});

module.exports = router;
