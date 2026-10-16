const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
        unique: true,
    },
    slug: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        maxlength: 120,
        unique: true,
    },
    image: {
        type: String,
        default: null,
        maxlength: 3_000_000,
    },
}, {
    timestamps: true,
});

categorySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Category', categorySchema);
