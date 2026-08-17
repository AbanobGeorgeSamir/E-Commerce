require('dotenv').config({ quiet: true });

const express = require('express');
const cors = require('cors');
const { connectDB, testConnection } = require('./config/db');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const orderRoutes = require('./routes/orders');
const checkoutRoutes = require('./routes/checkout');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

const allowedOrigins = new Set([
    ...String(process.env.FRONTEND_URL || '').split(','),
    ...String(process.env.CLIENT_ORIGIN || '').split(','),
].map((origin) => origin.trim()).filter(Boolean));

if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured.');
}

if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters in production.');
}

const isAllowedOrigin = (origin) => !origin || allowedOrigins.has(origin);

app.use(cors({
    origin(origin, callback) {
        if (isAllowedOrigin(origin)) {
            return callback(null, true);
        }

        return callback(new Error('Origin is not allowed by CORS.'));
    },
    credentials: true,
}));
app.use((req, res, next) => {
    res.set({
        'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Permissions-Policy': 'camera=(), geolocation=(), microphone=()'
    });
    next();
});
app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ extended: true, limit: '4mb' }));

const ensureDatabaseConnection = async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        next(Object.assign(new Error('Database connection is unavailable.'), { statusCode: 503 }));
    }
};

app.use('/api', ensureDatabaseConnection);

app.get('/api/health', async (req, res) => {
    try {
        await testConnection();
        return res.json({ status: 'ok', database: 'mongodb' });
    } catch (error) {
        return res.status(503).json({ status: 'error', database: 'disconnected' });
    }
});

app.use('/api', authRoutes);
app.use('/api', productRoutes);
app.use('/api', categoryRoutes);
app.use('/api', orderRoutes);
app.use('/api', checkoutRoutes);

app.use((req, res) => res.status(404).json({ message: 'Route not found.' }));

app.use((error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }

    if (error?.type === 'entity.parse.failed') {
        return res.status(400).json({ message: 'The request body must contain valid JSON.' });
    }

    if (error?.type === 'entity.too.large') {
        return res.status(413).json({ message: 'The request body is too large.' });
    }

    if (error?.message === 'Origin is not allowed by CORS.') {
        return res.status(403).json({ message: error.message });
    }

    const statusCode = Number(error?.statusCode) || 500;
    if (statusCode >= 500) {
        console.error('Unhandled request error:', error);
    }

    return res.status(statusCode).json({
        message: statusCode >= 500 ? 'An unexpected server error occurred.' : error.message
    });
});

const startServer = async () => {
    await connectDB();

    if (process.env.VERCEL) {
        console.log('MongoDB connected successfully.');
        return app;
    }

    const port = Number(process.env.PORT);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error('PORT must be a valid port number in backend/.env.');
    }

    return app.listen(port, () => {
        console.log('MongoDB connected successfully.');
        console.log('Backend running at http://localhost:' + port);
    });
};

if (require.main === module) {
    startServer().catch((error) => {
        console.error('Unable to start backend:', error.message);
        process.exit(1);
    });
}

// Vercel detects this callable Express application as a serverless function.
module.exports = app;
module.exports.default = app;
module.exports.app = app;
module.exports.startServer = startServer;
