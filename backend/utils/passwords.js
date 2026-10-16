const crypto = require('crypto');

const KEY_LENGTH = 64;
const HASH_PATTERN = /^scrypt\$([a-f0-9]{32})\$([a-f0-9]{128})$/i;

const hashPassword = (password) => new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, KEY_LENGTH, (error, derivedKey) => {
        if (error) {
            reject(error);
            return;
        }

        resolve(`scrypt$${salt}$${derivedKey.toString('hex')}`);
    });
});

const isPasswordHash = (value) => typeof value === 'string' && HASH_PATTERN.test(value);

const safeStringEqual = (left, right) => {
    const leftHash = crypto.createHash('sha256').update(String(left)).digest();
    const rightHash = crypto.createHash('sha256').update(String(right)).digest();
    return crypto.timingSafeEqual(leftHash, rightHash);
};

const verifyPassword = (password, storedValue) => new Promise((resolve, reject) => {
    if (!storedValue || typeof storedValue !== 'string' || typeof password !== 'string') {
        resolve(false);
        return;
    }

    const match = storedValue.match(HASH_PATTERN);
    if (!match) {
        // Legacy plaintext values are upgraded to scrypt immediately after a successful login.
        resolve(safeStringEqual(password, storedValue));
        return;
    }

    const [, salt, hashedValue] = match;
    crypto.scrypt(password, salt, KEY_LENGTH, (error, derivedKey) => {
        if (error) {
            reject(error);
            return;
        }

        const storedHash = Buffer.from(hashedValue, 'hex');
        resolve(storedHash.length === derivedKey.length && crypto.timingSafeEqual(storedHash, derivedKey));
    });
});

module.exports = { hashPassword, verifyPassword, isPasswordHash };
