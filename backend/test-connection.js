require('dotenv').config({ quiet: true });

const mongoose = require('mongoose');

const getMongoUri = () => String(process.env.MONGODB_URI || '').trim();

const normalizeMongoUri = (uri) => {
    const value = String(uri || '').trim();
    if (!value) {
        return '';
    }

    try {
        const parsed = new URL(value);
        parsed.pathname = `/ecommerce`;
        return parsed.toString();
    } catch {
        return value;
    }
};

const testConnection = async () => {
    const uri = normalizeMongoUri(getMongoUri());
    
    console.log('Testing MongoDB connection...');
    console.log('URI:', uri.substring(0, 50) + '...');
    
    try {
        await mongoose.connect(uri, {
            dbName: 'ecommerce',
            serverSelectionTimeoutMS: 5000,
        });
        
        console.log('✅ MongoDB connected successfully!');
        await mongoose.connection.db.admin().ping();
        console.log('✅ Ping successful!');
        
        await mongoose.disconnect();
        console.log('✅ Disconnected successfully!');
    } catch (error) {
        console.error('❌ Connection error:', error.message);
        process.exit(1);
    }
};

testConnection();
