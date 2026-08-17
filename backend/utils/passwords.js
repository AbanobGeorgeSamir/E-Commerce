const crypto = require('crypto');

const KEY_LENGTH = 64;

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

const verifyPassword = (password, storedValue) => new Promise((resolve, reject) => {
    if (!storedValue || typeof storedValue !== 'string') {
        resolve(false);
        return;
    }

    if (!storedValue.startsWith('scrypt$')) {
        resolve(password === storedValue);
        return;
    }

    const [, salt, hashedValue] = storedValue.split('$');
    crypto.scrypt(password, salt, KEY_LENGTH, (error, derivedKey) => {
        if (error) {
            reject(error);
            return;
        }

        const storedHash = Buffer.from(hashedValue, 'hex');
        if (storedHash.length !== derivedKey.length) {
            resolve(false);
            return;
        }

        resolve(crypto.timingSafeEqual(storedHash, derivedKey));
    });
});

module.exports = {
    hashPassword,
    verifyPassword,
};
