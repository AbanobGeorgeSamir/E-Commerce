const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const DATA_IMAGE_PATTERN = /^data:image\/(avif|jpe?g|png|webp);base64,([a-z0-9+/=\s]+)$/i;

const isSafeDataImage = (value) => {
    if (typeof value !== 'string') return false;

    const match = value.match(DATA_IMAGE_PATTERN);
    if (!match) return false;

    try {
        const imageBytes = Buffer.from(match[2], 'base64');
        return imageBytes.length > 0 && imageBytes.length <= MAX_IMAGE_BYTES;
    } catch (error) {
        return false;
    }
};

module.exports = {
    MAX_IMAGE_BYTES,
    isSafeDataImage,
};
