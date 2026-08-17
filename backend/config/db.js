const mongoose = require('mongoose');

const DEFAULT_DB_NAME = 'ecommerce';

const getMongoUri = () => String(process.env.MONGODB_URI || '').trim();

const normalizeMongoUri = (uri) => {
    const value = String(uri || '').trim();
    if (!value) {
        return '';
    }

    try {
        const parsed = new URL(value);
        parsed.pathname = `/${DEFAULT_DB_NAME}`;
        return parsed.toString();
    } catch {
        return value;
    }
};

const connectDB = async () => {
    const uri = normalizeMongoUri(getMongoUri());

    if (!uri) {
        throw new Error('MONGODB_URI is not configured.');
    }

    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    await mongoose.connect(uri, {
        dbName: DEFAULT_DB_NAME,
        serverSelectionTimeoutMS: 10000,
    });

    return mongoose.connection;
};

const testConnection = async () => {
    if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
        throw new Error('MongoDB is not connected.');
    }

    await mongoose.connection.db.admin().ping();
};

module.exports = { connectDB, testConnection, normalizeMongoUri };
