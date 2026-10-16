const AUTH_COOKIE_NAME = 'luxe_session';
const AUTH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const authCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api',
    maxAge: AUTH_COOKIE_MAX_AGE,
});

const setAuthCookie = (res, token) => {
    res.cookie(AUTH_COOKIE_NAME, token, authCookieOptions());
};

const clearAuthCookie = (res) => {
    const options = authCookieOptions();
    delete options.maxAge;
    res.clearCookie(AUTH_COOKIE_NAME, options);
};

const getAuthCookieToken = (req) => {
    const cookieHeader = req.get('cookie') || '';

    for (const cookie of cookieHeader.split(';')) {
        const separator = cookie.indexOf('=');
        if (separator < 0 || cookie.slice(0, separator).trim() !== AUTH_COOKIE_NAME) continue;

        const value = cookie.slice(separator + 1).trim();
        try {
            return decodeURIComponent(value);
        } catch {
            return '';
        }
    }

    return '';
};

module.exports = { setAuthCookie, clearAuthCookie, getAuthCookieToken };
