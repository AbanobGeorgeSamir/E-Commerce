const express = require('express');
const Category = require('../models/Category');
const Order = require('../models/Order');
const Product = require('../models/Product');
const auth = require('../middleware/authMiddleware');
const admin = require('../middleware/adminMiddleware');

const router = express.Router();

router.get('/admin/dashboard', auth, admin, async (req, res) => {
    try {
        const [productSummary, orderSummary, categoryCount, categoryDistribution, latestOrders] = await Promise.all([
            Product.aggregate([
                {
                    $group: {
                        _id: null,
                        totalProducts: { $sum: 1 },
                        totalStockUnits: { $sum: { $ifNull: ['$stock', 0] } },
                        lowStockCount: {
                            $sum: {
                                $cond: [{ $lt: [{ $ifNull: ['$stock', 0] }, 5] }, 1, 0],
                            },
                        },
                    },
                },
            ]),
            Order.aggregate([
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        totalRevenue: { $sum: '$total' },
                    },
                },
            ]),
            Category.countDocuments(),
            Product.aggregate([
                { $match: { category: { $ne: null } } },
                { $group: { _id: '$category', count: { $sum: 1 } } },
                {
                    $lookup: {
                        from: Category.collection.name,
                        localField: '_id',
                        foreignField: '_id',
                        as: 'category',
                    },
                },
                { $unwind: '$category' },
                { $project: { _id: 0, id: { $toString: '$_id' }, name: '$category.name', count: 1 } },
                { $sort: { name: 1 } },
            ]),
            Order.find()
                .select('shippingAddress.name total createdAt status')
                .sort({ createdAt: -1 })
                .limit(5)
                .lean(),
        ]);

        const products = productSummary[0] || {};
        const orders = orderSummary[0] || {};
        res.set('Cache-Control', 'private, no-store');
        return res.json({
            data: {
                totalProducts: products.totalProducts || 0,
                totalStockUnits: products.totalStockUnits || 0,
                lowStockCount: products.lowStockCount || 0,
                totalCategories: categoryCount,
                totalOrders: orders.totalOrders || 0,
                totalRevenue: orders.totalRevenue || 0,
                categoryDistribution,
                latestOrders: latestOrders.map((order) => ({
                    id: String(order._id),
                    name: order.shippingAddress?.name || 'Customer',
                    total: Number(order.total) || 0,
                    createdAt: order.createdAt,
                    status: order.status,
                })),
            },
        });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to load dashboard data.' });
    }
});

module.exports = router;
