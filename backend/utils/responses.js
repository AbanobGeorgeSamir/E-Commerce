const { isAdminUser } = require('../middleware/adminMiddleware');

const asObject = (value) => value && typeof value.toObject === 'function'
    ? value.toObject()
    : value || {};

const getId = (value) => {
    if (!value) return null;
    if (typeof value === 'object' && value._id) return String(value._id);
    return String(value);
};

const sanitizeUser = (user) => {
    if (!user) {
        return null;
    }

    const admin = isAdminUser(user);

    return {
        id: getId(user._id || user.id),
        name: user.name,
        email: user.email,
        role: admin ? 'admin' : user.role || null,
        is_admin: admin,
    };
};

const normalizeProduct = (product) => {
    if (!product) {
        return null;
    }

    const source = asObject(product);
    const category = asObject(source.category);
    const categoryId = getId(source.category);

    return {
        ...source,
        id: getId(source._id || source.id),
        image_url: source.image_url || source.image || null,
        category_id: categoryId,
        categoryId,
        category_name: category.name || source.categoryName || source.category_name || null,
        categoryName: category.name || source.categoryName || source.category_name || null,
        price: source.price !== undefined ? Number(source.price) : source.price,
        stock: source.stock !== undefined ? Number(source.stock) : source.stock,
    };
};

const normalizeOrder = (order) => {
    if (!order) {
        return null;
    }

    const source = asObject(order);
    const publicOrder = { ...source };
    delete publicOrder.receiptImage;
    delete publicOrder.receipt_image;
    delete publicOrder.image;
    const shippingAddress = asObject(source.shippingAddress || source.shipping_address);
    const street = source.street || shippingAddress.street || null;
    const city = source.city || shippingAddress.city || null;
    const zip = source.zip || source.postal_code || source.postalCode || shippingAddress.zip || null;
    const address = source.address || shippingAddress.address || [street, city, zip].filter(Boolean).join(', ') || null;

    return {
        ...publicOrder,
        id: getId(source._id || source.id),
        total: source.total !== undefined ? Number(source.total) : 0,
        total_amount: source.total !== undefined ? Number(source.total) : 0,
        subtotal: source.subtotal !== undefined ? Number(source.subtotal) : (source.total !== undefined ? Number(source.total) : 0),
        shippingFee: source.shippingFee !== undefined ? Number(source.shippingFee) : 0,
        shipping_fee: source.shippingFee !== undefined ? Number(source.shippingFee) : 0,
        tax: source.tax !== undefined ? Number(source.tax) : 0,
        shippingAddress,
        shipping_address: shippingAddress,
        payment: source.payment || source.paymentMethod || source.payment_method || null,
        payment_method: source.paymentMethod || source.payment_method || null,
        name: source.name || shippingAddress.name || null,
        email: source.email || shippingAddress.email || null,
        phone: source.phone || source.customer_phone || shippingAddress.phone || null,
        street,
        city,
        zip,
        address,
        items: Array.isArray(source.items)
            ? source.items.map((item) => {
                const orderItem = asObject(item);
                return {
                ...orderItem,
                id: getId(orderItem._id || orderItem.id),
                price: orderItem.price !== undefined ? Number(orderItem.price) : orderItem.price,
                quantity: orderItem.quantity !== undefined ? Number(orderItem.quantity) : orderItem.quantity,
                product_id: getId(orderItem.product),
            }})
            : [],
    };
};

module.exports = {
    sanitizeUser,
    normalizeProduct,
    normalizeOrder,
};
