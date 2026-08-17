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

    return {
        id: getId(user._id || user.id),
        name: user.name,
        email: user.email,
        role: user.role || null,
        is_admin: user.role === 'admin',
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
    const shippingAddress = asObject(source.shippingAddress || source.shipping_address);
    const street = source.street || shippingAddress.street || null;
    const city = source.city || shippingAddress.city || null;
    const zip = source.zip || source.postal_code || source.postalCode || shippingAddress.zip || null;
    const address = source.address || shippingAddress.address || [street, city, zip].filter(Boolean).join(', ') || null;

    return {
        ...source,
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
        image: source.receiptImage || source.image || null,
        receipt_image: source.receiptImage || source.receipt_image || null,
        items: Array.isArray(source.items)
            ? source.items.map((item) => {
                const orderItem = asObject(item);
                return {
                ...orderItem,
                id: getId(orderItem._id || orderItem.id),
                price: item.price !== undefined ? Number(item.price) : item.price,
                quantity: item.quantity !== undefined ? Number(item.quantity) : item.quantity,
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
