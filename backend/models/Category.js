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
        index: true,
    },
    image: {
        type: String,
        default: null,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Category', categorySchema);
