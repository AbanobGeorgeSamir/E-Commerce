import { ASSET_BASE_URL } from '../config/env';

const collectionKeys = [
  'data',
  'items',
  'results',
  'rows',
  'docs',
  'products',
  'categories',
  'orders',
  'orderItems'];

const itemKeys = ['data', 'item', 'product', 'category', 'order', 'user', 'result'];

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const firstDefined = (...values) => values.find((value) => value !== undefined && value !== null);
const isBrowserFile = (value) => typeof File !== 'undefined' && value instanceof File;

export const MAX_IMAGE_FILE_SIZE = 2 * 1024 * 1024;
export const SUPPORTED_IMAGE_TYPES = new Set([
  'image/avif',
  'image/jpeg',
  'image/png',
  'image/webp'
]);

export const getImageFileError = (file) => {
  if (!isBrowserFile(file)) return 'Please select an image file.';
  if (!SUPPORTED_IMAGE_TYPES.has(file.type)) return 'Use an AVIF, JPG, PNG, or WEBP image.';
  if (file.size > MAX_IMAGE_FILE_SIZE) return 'Image files must be 2 MB or smaller.';
  return '';
};

const parseJsonObject = (value) => {
  if (!value) return null;
  if (isObject(value)) return value;
  if (typeof value !== 'string') return null;

  try {
    const parsed = JSON.parse(value);
    return isObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const getOrderShippingDetails = (order) =>
  parseJsonObject(firstDefined(order?.shippingAddress, order?.shipping_address));

const findFirstArray = (payload) => {
  if (!isObject(payload)) return null;

  return collectionKeys.reduce((match, key) => {
    if (match) return match;
    return Array.isArray(payload[key]) ? payload[key] : null;
  }, null);
};

export const normalizeCollection = (payload) => {
  if (Array.isArray(payload)) return payload;

  const nestedArray = findFirstArray(payload);
  if (nestedArray) return nestedArray;

  return [];
};

export const normalizeItem = (payload) => {
  if (!isObject(payload)) return payload;

  for (const key of itemKeys) {
    if (isObject(payload[key])) {
      return payload[key];
    }
  }

  return payload;
};

export const getEntityId = (value) => {
  if (!value) return '';
  if (typeof value !== 'object') return String(value);

  return String(
    firstDefined(
      value.id,
      value._id,
      value.product_id,
      value.productId,
      value.category_id,
      value.categoryId,
      value.order_id,
      value.orderId
    ) || ''
  );
};

export const extractToken = (payload) => {
  const normalized = normalizeItem(payload) || payload;
  const tokenContainer = normalized?.tokens || normalized?.auth || normalized?.data || {};

  return (
    payload?.token ||
    payload?.accessToken ||
    payload?.access_token ||
    payload?.jwt ||
    normalized?.token ||
    normalized?.accessToken ||
    normalized?.access_token ||
    normalized?.jwt ||
    tokenContainer?.token ||
    tokenContainer?.accessToken ||
    tokenContainer?.access_token ||
    '');

};

export const normalizeValidationErrors = (payload) => {
  if (payload?.errors && isObject(payload.errors)) {
    return payload.errors;
  }

  if (Array.isArray(payload?.message)) {
    return { form: payload.message };
  }

  if (typeof payload?.message === 'string') {
    return { form: [payload.message] };
  }

  return {};
};

export const getApiErrorMessage = (error, fallback = 'Something went wrong') => {
  const payload = error?.response?.data;
  const validationErrors = normalizeValidationErrors(payload);
  const firstValidationMessage = Object.values(validationErrors).flat()[0];

  return (
    firstValidationMessage ||
    payload?.message ||
    payload?.error ||
    error?.message ||
    fallback);

};

export const toCurrency = (value) => {
  const numericValue = Number(value) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(numericValue);
};

export const getImageUrl = (value) => {
  if (!value) return '';

  if (typeof value === 'object') {
    return getImageUrl(
      value.url || value.path || value.secure_url || value.location || value.filename || ''
    );
  }

  if (typeof value !== 'string') return '';
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')) {
    return value;
  }

  const cleanedPath = value.replace(/\\/g, '/').replace(/^\/+/, '');
  return `${ASSET_BASE_URL}/${cleanedPath}`;
};

export const getProductImage = (product) =>
  getImageUrl(
    firstDefined(
      product?.image_url,
      product?.imageUrl,
      product?.image,
      product?.thumbnail,
      product?.thumbnail_url,
      product?.photo,
      product?.file
    )
  );

export const normalizeProduct = (product) => ({
  ...product,
  id: getEntityId(product),
  image: firstDefined(product?.image, product?.image_url, product?.imageUrl, '') || '',
  image_url: firstDefined(product?.image_url, product?.imageUrl, product?.image, '') || '',
  category_id: firstDefined(product?.category_id, product?.categoryId, '') || ''
});

export const normalizeCategory = (category) => ({
  ...category,
  id: getEntityId(category),
  name: firstDefined(category?.name, category?.title, category?.label) || ''
});

export const normalizeOrder = (order) => ({
  ...order,
  id: getEntityId(order)
});

export const getProductCategoryName = (product) =>
  firstDefined(
    product?.category?.name,
    product?.category_name,
    product?.categoryName,
    product?.category?.title,
    typeof product?.category === 'string' ? product.category : null
  ) || 'Featured';

export const buildCategoryPayload = (name) => ({
  name: String(name || '').trim(),
  title: String(name || '').trim(),
  label: String(name || '').trim()
});

export const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    if (!isBrowserFile(file)) {
      resolve('');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('Failed to read the selected file.'));
    reader.readAsDataURL(file);
  });

export const buildProductPayload = async (product) => {
  const categoryId = firstDefined(product?.category_id, product?.categoryId, '') || '';
  const productName = String(product?.name || '').trim();
  const description = String(product?.description || '').trim();
  const stock = String(firstDefined(product?.stock, 0)).trim();
  const price = String(firstDefined(product?.price, 0)).trim();
  const payload = {
    name: productName,
    title: productName,
    price,
    stock,
    quantity: stock,
    description,
    details: description,
    category_id: String(categoryId),
    categoryId: String(categoryId)
  };

  if (isBrowserFile(product?.image)) {
    const encodedImage = await readFileAsDataUrl(product.image);
    if (encodedImage) {
      payload.image = encodedImage;
    }
  } else if (typeof product?.image === 'string' && product.image.trim() && !product.image.startsWith('blob:')) {
    payload.image = product.image.trim();
  }

  return payload;
};

export const getUserRole = (user) =>
  user?.role ||
  user?.user_role ||
  user?.type ||
  user?.permissions?.role ||
  user?.roles?.[0]?.name;

export const isAdminUser = (user) =>
  user?.is_admin === true ||
  user?.is_admin === 1 ||
  user?.is_admin === '1' ||
  user?.isAdmin === true ||
  String(getUserRole(user)).toLowerCase() === 'admin';

export const getOrderItems = (order) => {
  const rawItems = normalizeCollection(
    firstDefined(order?.items, order?.orderItems, order?.products, order?.details)
  );

  return rawItems.map((item, index) => {
    const product = normalizeItem(item?.product || item);
    const quantity = Number(firstDefined(item?.quantity, item?.qty, item?.count, 1)) || 1;
    const price = Number(
      firstDefined(item?.price, item?.unit_price, item?.unitPrice, product?.price, 0)
    ) || 0;

    return {
      ...item,
      id: firstDefined(item?.id, item?._id, `${firstDefined(order?.id, order?._id, 'order')}-${index}`),
      quantity,
      price,
      product: product && isObject(product) ? product : null,
      name: firstDefined(item?.name, product?.name),
      image: firstDefined(item?.image, product?.image, product?.image_url, product?.imageUrl),
      product_id: firstDefined(item?.product_id, item?.productId, product?.id, product?._id)
    };
  });
};

export const getOrderStatus = (order) =>
  firstDefined(order?.status, order?.orderStatus, order?.state, order?.payment_status) || 'pending';

export const getOrderTotal = (order) =>
  Number(
    firstDefined(
      order?.total_amount,
      order?.total,
      order?.total_price,
      order?.totalPrice,
      order?.subtotal,
      order?.amount,
      order?.order_total,
      order?.grandTotal
    )
  ) || 0;

export const getOrderDate = (order) =>
  firstDefined(order?.created_at, order?.createdAt, order?.date, order?.orderDate) || null;

export const getOrderCustomerName = (order) =>
  firstDefined(
    order?.name,
    order?.fullName,
    order?.customer_name,
    getOrderShippingDetails(order)?.name,
    order?.user?.name
  ) || 'Customer';

export const getOrderPhone = (order) =>
  firstDefined(
    order?.phone,
    order?.phoneNumber,
    order?.customer_phone,
    getOrderShippingDetails(order)?.phone,
    order?.user?.phone
  ) ||
  'No phone provided';

export const getOrderAddress = (order) =>
  firstDefined(
    order?.address,
    order?.street,
    getOrderShippingDetails(order)?.address,
    getOrderShippingDetails(order)?.street,
    order?.shippingAddress?.address,
    order?.shippingAddress?.street,
    [order?.street, order?.city, order?.zip].filter(Boolean).join(', '),
    [order?.shippingAddress?.street, order?.shippingAddress?.city, order?.shippingAddress?.zip].
      filter(Boolean).
      join(', ')
  ) || 'No address provided';
