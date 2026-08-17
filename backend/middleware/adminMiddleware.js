const getAdminEmails = () => (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

module.exports = (req, res, next) => {
    const user = req.user;

    if (!user) {
        return res.status(401).json({ message: 'Unauthorized. Please login.' });
    }

    const email = typeof user.email === 'string' ? user.email.toLowerCase() : '';
    const isEnvAdmin = getAdminEmails().includes(email);
    const isRoleAdmin = user.role === 'admin';
    const isFlagAdmin = user.is_admin === true || user.is_admin === 1 || user.is_admin === '1';

    if (isRoleAdmin || isFlagAdmin || isEnvAdmin) {
        return next();
    }

    return res.status(403).json({
        message: 'Forbidden. Admin access required.',
    });
};
