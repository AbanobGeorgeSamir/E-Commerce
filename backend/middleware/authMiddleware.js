const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
    try {
        const authorization = req.get('authorization') || '';
        const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';

        if (!token) {
            return res.status(401).json({ message: 'Unauthorized. Please login.' });
        }

        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(payload.userId);

        if (!user) {
            return res.status(401).json({ message: 'Unauthorized. User account not found.' });
        }

        req.user = user;
        return next();
    } catch (error) {
        return res.status(401).json({ message: 'Unauthorized. Please login again.' });
    }
};
