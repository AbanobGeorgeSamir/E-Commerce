const getAdminEmails = () => (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

const isAdminUser = (user = {}) => {
    const email = typeof user.email === 'string' ? user.email.trim().toLowerCase() : '';
    const isFlagAdmin = user.is_admin === true || user.is_admin === 1 || user.is_admin === '1';

    return String(user.role || '').trim().toLowerCase() === 'admin' || isFlagAdmin || getAdminEmails().includes(email);
};

const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized. Please login.' });
    }

    if (!isAdminUser(req.user)) {
        return res.status(403).json({ message: 'Forbidden. Admin access required.' });
    }

    return next();
};

module.exports = requireAdmin;
module.exports.isAdminUser = isAdminUser;
