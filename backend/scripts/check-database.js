require('dotenv').config({ path: require('path').join(__dirname, '..', '.env'), quiet: true });

const mongoose = require('mongoose');
const { connectDB, testConnection } = require('../config/db');

const run = async () => {
    try {
        await connectDB();
        await testConnection();
        console.log('MongoDB connection and ping succeeded.');
    } catch (error) {
        console.error('MongoDB connection check failed:', error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
};

run();
