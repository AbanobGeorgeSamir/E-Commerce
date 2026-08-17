const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { hashPassword, verifyPassword } = require('../utils/passwords');
const { sanitizeUser } = require('../utils/responses');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

const normalizeCredentials = (body = {}) => ({
    name: typeof body.name === 'string' ? body.name.trim() : '',
    email: typeof body.email === 'string' ? body.email.trim().toLowerCase() : '',
    password: typeof body.password === 'string' ? body.password : '',
    passwordConfirmation: typeof (body.password_confirmation || body.passwordConfirmation || body.confirmPassword) === 'string'
        ? body.password_confirmation || body.passwordConfirmation || body.confirmPassword
        : '',
});

const validEmail = (email) => /^\S+@\S+\.\S+$/.test(email);

const signToken = (user) => jwt.sign(
    { userId: String(user._id), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
);

router.post(['/register', '/auth/register'], async (req, res) => {
    try {
        const { name, email, password, passwordConfirmation } = normalizeCredentials(req.body);

        if (!name || !email || !password) {
            return res.status(422).json({ message: 'Name, email, and password are required.' });
        }

        if (!validEmail(email)) {
            return res.status(422).json({ message: 'Please enter a valid email address.' });
        }

        if (password.length < 6) {
            return res.status(422).json({ message: 'Password must be at least 6 characters.' });
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

        return res.status(201).json({
            message: 'Registration successful.',
            user: sanitizeUser(user),
            token: signToken(user),
        });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({ message: 'Email already exists.' });
        }

        return res.status(500).json({ message: 'Registration failed.' });
    }
});

router.post(['/login', '/auth/login'], async (req, res) => {
    try {
        const { email, password } = normalizeCredentials(req.body);

        if (!email || !password) {
            return res.status(422).json({ message: 'Email and password are required.' });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user || !await verifyPassword(password, user.password)) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        return res.json({
            message: 'Login successful.',
            user: sanitizeUser(user),
            token: signToken(user),
        });
    } catch (error) {
        return res.status(500).json({ message: 'Login failed.' });
    }
});

router.get('/user', auth, (req, res) => res.json({ user: sanitizeUser(req.user) }));
router.get('/auth/me', auth, (req, res) => res.json({ user: sanitizeUser(req.user) }));
router.post(['/logout', '/auth/logout'], (req, res) => res.json({ message: 'Logout successful.' }));

module.exports = router;
