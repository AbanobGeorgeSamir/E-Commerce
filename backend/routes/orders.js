const express = require('express');
const Order = require('../models/Order');
const auth = require('../middleware/authMiddleware');
const { normalizeOrder } = require('../utils/responses');

const router = express.Router();

const getAdminEmails = () => (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

const isAdminUser = (user = {}) => (
    user.role === 'admin' ||
    getAdminEmails().includes(String(user.email || '').toLowerCase())
);

router.get('/orders', auth, async (req, res) => {
    try {
        const filter = isAdminUser(req.user) ? {} : { user: req.user._id };
        const orders = await Order.find(filter)
            .populate('items.product', 'name image price')
            .sort({ createdAt: -1 });
        const data = orders.map(normalizeOrder);

        return res.json({ data, orders: data });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to load orders.' });
    }
});

router.get('/orders/:id', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('items.product', 'name image price');
        
        if (!order) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        // Check if user owns this order or is admin
        if (!isAdminUser(req.user) && String(order.user) !== String(req.user._id)) {
            return res.status(403).json({ message: 'You do not have permission to view this order.' });
        }

        return res.json({ data: normalizeOrder(order) });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to load order.' });
    }
});

module.exports = router;
