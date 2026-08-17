const express = require('express');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const auth = require('../middleware/authMiddleware');
const admin = require('../middleware/adminMiddleware');
const { normalizeProduct } = require('../utils/responses');
const { slugify } = require('../utils/text');
const { isSafeDataImage } = require('../utils/images');

const router = express.Router();

const firstDefined = (...values) => values.find((value) => value !== undefined && value !== null);

const normalizeProductInput = (body = {}) => {
    const priceValue = firstDefined(body.price, body.cost);
    const stockValue = firstDefined(body.stock, body.quantity);
    const categoryId = firstDefined(body.category_id, body.categoryId);

    return {
        name: typeof firstDefined(body.name, body.title) === 'string' ? firstDefined(body.name, body.title).trim() : '',
        description: typeof firstDefined(body.description, body.details) === 'string'
            ? firstDefined(body.description, body.details).trim()
            : '',
        image: typeof firstDefined(body.image, body.image_url, body.photo, body.file) === 'string'
            ? firstDefined(body.image, body.image_url, body.photo, body.file).trim()
            : undefined,
        price: priceValue === '' || priceValue === null || priceValue === undefined ? undefined : Number(priceValue),
        stock: stockValue === '' || stockValue === null || stockValue === undefined ? undefined : Number(stockValue),
        categoryId: categoryId === '' || categoryId === null || categoryId === undefined ? undefined : String(categoryId),
    };
};

const serializeProduct = (product) => normalizeProduct(product);

const productQuery = () => Product.find().populate('category', 'name slug image').sort({ createdAt: -1 });

const getProductById = async (id) => {
    if (!mongoose.isValidObjectId(id)) return null;
    return Product.findById(id).populate('category', 'name slug image');
};

const buildUniqueProductSlug = async (name, excludedId) => {
    const baseSlug = slugify(name) || 'product';
    const filter = { slug: new RegExp('^' + baseSlug + '(-[0-9]+)?$', 'i') };
    if (excludedId) filter._id = { $ne: excludedId };

    const existing = await Product.find(filter).select('slug').lean();
    const slugs = new Set(existing.map((product) => product.slug));

    if (!slugs.has(baseSlug)) return baseSlug;

    let suffix = 2;
    while (slugs.has(baseSlug + '-' + suffix)) suffix += 1;
    return baseSlug + '-' + suffix;
};

const validateInput = async (input) => {
    if (input.price !== undefined && (!Number.isFinite(input.price) || input.price < 0)) {
        return 'Price must be a non-negative number.';
    }

    if (input.stock !== undefined && (!Number.isInteger(input.stock) || input.stock < 0)) {
        return 'Stock must be a non-negative whole number.';
    }

    if (input.categoryId !== undefined) {
        if (!mongoose.isValidObjectId(input.categoryId) || !await Category.exists({ _id: input.categoryId })) {
            return 'Selected category does not exist.';
        }
    }

    if (input.image && input.image.startsWith('data:') && !isSafeDataImage(input.image)) {
        return 'Product images must be JPG, PNG, WEBP, or AVIF files smaller than 2 MB.';
    }

    return null;
};

router.get('/products', async (req, res) => {
    try {
        const products = await productQuery();
        res.set('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=300');
        return res.json({ data: products.map(serializeProduct) });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to load products.' });
    }
});

router.get('/products/:id', async (req, res) => {
    try {
        const product = await getProductById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        res.set('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=300');
        return res.json({ data: serializeProduct(product) });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to load product.' });
    }
});

router.post('/products', auth, admin, async (req, res) => {
    try {
        const input = normalizeProductInput(req.body);
        if (!input.name || input.price === undefined || !Number.isFinite(input.price) || input.price < 0) {
            return res.status(422).json({ message: 'Product name and a valid non-negative price are required.' });
        }

        const validationMessage = await validateInput(input);
        if (validationMessage) {
            return res.status(422).json({ message: validationMessage });
        }

        const product = await Product.create({
            name: input.name,
            slug: await buildUniqueProductSlug(input.name),
            description: input.description,
            image: input.image || null,
            price: input.price,
            category: input.categoryId || null,
            stock: input.stock ?? 0,
        });
        await product.populate('category', 'name slug image');

        return res.status(201).json({
            message: 'Product created successfully.',
            data: serializeProduct(product),
        });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({ message: 'A product with this slug already exists.' });
        }
        return res.status(500).json({ message: 'Failed to create product.' });
    }
});

router.put('/products/:id', auth, admin, async (req, res) => {
    try {
        const product = await getProductById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        const input = normalizeProductInput(req.body);
        const validationMessage = await validateInput(input);
        if (validationMessage) {
            return res.status(422).json({ message: validationMessage });
        }

        if (input.name) {
            product.name = input.name;
            product.slug = await buildUniqueProductSlug(input.name, product._id);
        }
        if (input.description) product.description = input.description;
        if (input.image !== undefined) product.image = input.image || null;
        if (input.price !== undefined) product.price = input.price;
        if (input.stock !== undefined) product.stock = input.stock;
        if (input.categoryId !== undefined) product.category = input.categoryId;
        await product.save();
        await product.populate('category', 'name slug image');

        return res.json({
            message: 'Product updated successfully.',
            data: serializeProduct(product),
        });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({ message: 'A product with this slug already exists.' });
        }
        return res.status(500).json({ message: 'Failed to update product.' });
    }
});

router.delete('/products/:id', auth, admin, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        return res.json({ message: 'Product deleted successfully.' });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to delete product.' });
    }
});

module.exports = router;
