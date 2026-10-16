const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
    },
    slug: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        maxlength: 240,
        unique: true,
    },
    description: {
        type: String,
        default: '',
        maxlength: 5000,
    },
    image: {
        type: String,
        default: null,
        maxlength: 3_000_000,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null,
    },
    stock: {
        type: Number,
        default: 0,
        min: 0,
        validate: {
            validator: Number.isInteger,
            message: 'Stock must be a whole number.',
        },
    },
}, {
    timestamps: true,
});

productSchema.index({ createdAt: -1 });
productSchema.index({ category: 1 });

module.exports = mongoose.model('Product', productSchema);
