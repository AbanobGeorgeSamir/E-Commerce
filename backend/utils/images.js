const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const DATA_IMAGE_PATTERN = /^data:image\/(avif|jpe?g|png|webp);base64,([a-z0-9+/]+={0,2})$/i;

const isSafeDataImage = (value) => {
    if (typeof value !== 'string') return false;

    const match = value.match(DATA_IMAGE_PATTERN);
    if (!match) return false;

    const encoded = match[2];
    const maximumEncodedLength = Math.ceil(MAX_IMAGE_BYTES / 3) * 4;
    if (!encoded || encoded.length > maximumEncodedLength || encoded.length % 4 !== 0) return false;

    const imageBytes = Buffer.from(encoded, 'base64');
    return imageBytes.length > 0 &&
        imageBytes.length <= MAX_IMAGE_BYTES &&
        imageBytes.toString('base64') === encoded;
};

const isSafeImageSource = (value) => {
    if (value === undefined || value === null || value === '') return true;
    if (typeof value !== 'string' || value.length > 3_000_000) return false;
    if (value.startsWith('data:')) return isSafeDataImage(value);

    const trimmed = value.trim();
    if (!trimmed || /[\u0000-\u001f\u007f]/.test(trimmed) || trimmed.startsWith('//')) return false;

    if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
        try {
            const url = new URL(trimmed);
            const isSecureUrl = url.protocol === 'https:';
            const isLocalDevelopmentUrl = url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname);
            return (isSecureUrl || isLocalDevelopmentUrl) && !url.username && !url.password;
        } catch {
            return false;
        }
    }

    const pathSegments = trimmed.replace(/\\/g, '/').split('/');
    return !pathSegments.includes('..');
};

module.exports = { MAX_IMAGE_BYTES, isSafeDataImage, isSafeImageSource };
