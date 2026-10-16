const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getAuthCookieToken } = require('../utils/authCookies');

const unauthorized = (res) => res.status(401).json({ message: 'Unauthorized. Please login again.' });

module.exports = async (req, res, next) => {
    const authorization = req.get('authorization') || '';
    const bearerToken = /^Bearer\s+(.+)$/i.exec(authorization)?.[1]?.trim() || '';
    // Prefer the browser cookie so an old bearer token cannot shadow a newer login.
    const tokens = [...new Set([getAuthCookieToken(req), bearerToken].filter(Boolean))];
    let authenticatedToken = '';
    let payload = null;

    for (const token of tokens) {
        try {
            const candidate = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
            if (candidate && typeof candidate.userId === 'string' && mongoose.isValidObjectId(candidate.userId)) {
                authenticatedToken = token;
                payload = candidate;
                break;
            }
        } catch {
            // Try the other supported transport before rejecting the request.
        }
    }

    if (!payload) {
        return unauthorized(res);
    }

    try {
        const user = await User.findById(payload.userId);
        if (!user) {
            return unauthorized(res);
        }

        req.user = user;
        req.authToken = authenticatedToken;
        return next();
    } catch (error) {
        // Database failures are server errors, not evidence of an invalid session.
        return next(error);
    }
};
