const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { hashPassword, verifyPassword, isPasswordHash } = require('../utils/passwords');
const { sanitizeUser } = require('../utils/responses');
const { setAuthCookie, clearAuthCookie } = require('../utils/authCookies');
const auth = require('../middleware/authMiddleware');
const { createRateLimiter } = require('../middleware/rateLimit');

const router = express.Router();
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;
const MAX_LOGIN_PASSWORD_LENGTH = 1024;
const limitLoginAttempts = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: 'Too many sign-in attempts. Please try again in a few minutes.',
});
const limitRegistrationAttempts = createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: 'Too many account creation attempts. Please try again later.',
});

const normalizeCredentials = (body = {}) => ({
    name: typeof body.name === 'string' ? body.name.trim() : '',
    email: typeof body.email === 'string' ? body.email.trim().toLowerCase() : '',
    password: typeof body.password === 'string' ? body.password : '',
    passwordConfirmation: typeof (body.password_confirmation || body.passwordConfirmation || body.confirmPassword) === 'string'
        ? body.password_confirmation || body.passwordConfirmation || body.confirmPassword
        : '',
});

const validEmail = (email) => /^\S+@\S+\.\S+$/.test(email) && email.length <= 254;

const signToken = (user) => jwt.sign(
    { userId: String(user._id), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d', algorithm: 'HS256' }
);

const sendAuthenticated = (req, res, user, statusCode, message) => {
    const token = signToken(user);
    setAuthCookie(res, token);
    res.set('Cache-Control', 'no-store');

    const response = { message, user: sanitizeUser(user) };
    // Keep the bearer response for native clients. Browser clients use the HttpOnly cookie.
    if (req.get('x-auth-transport') !== 'cookie') {
        response.token = token;
    }

    return res.status(statusCode).json(response);
};

router.post(['/register', '/auth/register'], limitRegistrationAttempts, async (req, res) => {
    try {
        const { name, email, password, passwordConfirmation } = normalizeCredentials(req.body);

        if (!name || !email || !password) {
            return res.status(422).json({ message: 'Name, email, and password are required.' });
        }

        if (name.length > 120) {
            return res.status(422).json({ message: 'Name must be 120 characters or fewer.' });
        }

        if (!validEmail(email)) {
            return res.status(422).json({ message: 'Please enter a valid email address.' });
        }

        if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
            return res.status(422).json({ message: `Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters.` });
        }

        if (passwordConfirmation && password !== passwordConfirmation) {
            return res.status(422).json({ message: 'Passwords do not match.' });
        }

        const existingUser = await User.exists({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'Email already exists.' });
        }

        const user = await User.create({
            name,
            email,
            password: await hashPassword(password),
        });

        return sendAuthenticated(req, res, user, 201, 'Registration successful.');
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({ message: 'Email already exists.' });
        }

        return res.status(500).json({ message: 'Registration failed.' });
    }
});

router.post(['/login', '/auth/login'], limitLoginAttempts, async (req, res) => {
    try {
        const { email, password } = normalizeCredentials(req.body);

        if (!email || !password) {
            return res.status(422).json({ message: 'Email and password are required.' });
        }

        if (password.length > MAX_LOGIN_PASSWORD_LENGTH) {
            return res.status(422).json({ message: 'Password is too long.' });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user || !await verifyPassword(password, user.password)) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        if (!isPasswordHash(user.password)) {
            user.password = await hashPassword(password);
            await user.save();
        }

        return sendAuthenticated(req, res, user, 200, 'Login successful.');
    } catch (error) {
        return res.status(500).json({ message: 'Login failed.' });
    }
});

const currentUser = (req, res) => {
    setAuthCookie(res, req.authToken);
    res.set('Cache-Control', 'no-store');
    return res.json({ user: sanitizeUser(req.user) });
};

router.get('/user', auth, currentUser);
router.get('/auth/me', auth, currentUser);
router.post(['/logout', '/auth/logout'], (req, res) => {
    clearAuthCookie(res);
    res.set('Cache-Control', 'no-store');
    return res.json({ message: 'Logout successful.' });
});

module.exports = router;
