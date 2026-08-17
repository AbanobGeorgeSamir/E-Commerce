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
        index: true,
    },
    description: {
        type: String,
        default: '',
        maxlength: 5000,
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

module.exports = mongoose.model('Product', productSchema);
