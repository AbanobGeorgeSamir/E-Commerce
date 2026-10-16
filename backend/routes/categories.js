const express = require('express');
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');
const auth = require('../middleware/authMiddleware');
const admin = require('../middleware/adminMiddleware');
const { slugify } = require('../utils/text');
const { isSafeImageSource } = require('../utils/images');

const router = express.Router();

const normalizeCategoryInput = (body = {}) => ({
    name: typeof body.name === 'string' ? body.name.trim() : typeof body.title === 'string' ? body.title.trim() : '',
    slug: typeof body.slug === 'string' ? body.slug.trim() : '',
    image: typeof body.image === 'string' ? body.image.trim() : undefined,
});

const serializeCategory = (category) => {
    const source = category.toObject ? category.toObject() : category;
    return { ...source, id: String(source._id) };
};

router.get('/categories', async (req, res) => {
    try {
        const categories = await Category.find().sort({ createdAt: -1 }).lean();
        res.set('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=300');
        return res.json({ data: categories.map(serializeCategory) });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to load categories.' });
    }
});

router.get('/categories/:id', async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ message: 'Category not found.' });
        }

        const category = await Category.findById(req.params.id).lean();
        if (!category) {
            return res.status(404).json({ message: 'Category not found.' });
        }

        return res.json({ data: serializeCategory(category) });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to load category.' });
    }
});

router.post('/categories', auth, admin, async (req, res) => {
    try {
        const input = normalizeCategoryInput(req.body);
        if (!input.name) {
            return res.status(422).json({ message: 'Category name is required.' });
        }
        if (input.name.length > 100) {
            return res.status(422).json({ message: 'Category name must be 100 characters or fewer.' });
        }

        const slug = slugify(input.slug || input.name);
        if (!slug || slug.length > 120) {
            return res.status(422).json({ message: 'Category name must include letters or numbers.' });
        }
        if (input.image !== undefined && !isSafeImageSource(input.image)) {
            return res.status(422).json({ message: 'Use a secure HTTPS image URL, a relative asset path, or a supported image smaller than 2 MB.' });
        }

        const duplicate = await Category.exists({ $or: [{ name: input.name }, { slug }] });
        if (duplicate) {
            return res.status(409).json({ message: 'Category name or slug already exists.' });
        }

        const category = await Category.create({ name: input.name, slug, image: input.image || null });
        return res.status(201).json({ message: 'Category created successfully.', data: serializeCategory(category) });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({ message: 'Category name or slug already exists.' });
        }
        return res.status(500).json({ message: 'Failed to create category.' });
    }
});

router.put('/categories/:id', auth, admin, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ message: 'Category not found.' });
        }

        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found.' });
        }

        const input = normalizeCategoryInput(req.body);
        const nextName = input.name || category.name;
        const nextSlug = slugify(input.slug || (input.name ? input.name : category.slug));
        if (nextName.length > 100) {
            return res.status(422).json({ message: 'Category name must be 100 characters or fewer.' });
        }
        if (!nextSlug || nextSlug.length > 120) {
            return res.status(422).json({ message: 'Category name must include letters or numbers.' });
        }
        if (input.image !== undefined && !isSafeImageSource(input.image)) {
            return res.status(422).json({ message: 'Use a secure HTTPS image URL, a relative asset path, or a supported image smaller than 2 MB.' });
        }

        const duplicate = await Category.exists({
            _id: { $ne: category._id },
            $or: [{ name: nextName }, { slug: nextSlug }],
        });
        if (duplicate) {
            return res.status(409).json({ message: 'Category name or slug already exists.' });
        }

        category.name = nextName;
        category.slug = nextSlug;
        if (input.image !== undefined) category.image = input.image || null;
        await category.save();

        return res.json({ message: 'Category updated successfully.', data: serializeCategory(category) });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({ message: 'Category name or slug already exists.' });
        }
        return res.status(500).json({ message: 'Failed to update category.' });
    }
});

router.delete('/categories/:id', auth, admin, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ message: 'Category not found.' });
        }

        const productCount = await Product.countDocuments({ category: req.params.id });
        if (productCount > 0) {
            return res.status(409).json({ message: 'Remove or recategorize products before deleting this category.' });
        }

        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found.' });
        }

        return res.json({ message: 'Category deleted successfully.' });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to delete category.' });
    }
});

module.exports = router;
