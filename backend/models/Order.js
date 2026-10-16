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
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    phone: { type: String, required: true, trim: true, maxlength: 40 },
    street: { type: String, required: true, trim: true, maxlength: 200 },
    city: { type: String, required: true, trim: true, maxlength: 100 },
    zip: { type: String, default: '', trim: true, maxlength: 32 },
    address: { type: String, required: true, trim: true, maxlength: 350 },
}, { _id: false });

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
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
        enum: ['Cash on Delivery'],
        default: 'Cash on Delivery',
        trim: true,
    },
    receiptImage: {
        type: String,
        required: true,
        maxlength: 3_000_000,
    },
}, {
    timestamps: true,
});

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
