const createRateLimiter = ({ windowMs, max, message }) => {
    const buckets = new Map();
    let requests = 0;

    return (req, res, next) => {
        const now = Date.now();
        const key = req.ip || req.socket?.remoteAddress || 'unknown';
        let bucket = buckets.get(key);

        if (!bucket || bucket.resetAt <= now) {
            bucket = { count: 0, resetAt: now + windowMs };
            buckets.set(key, bucket);
        }

        if (bucket.count >= max) {
            res.set('Retry-After', String(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))));
            return res.status(429).json({ message });
        }

        bucket.count += 1;
        requests += 1;
        if (requests % 256 === 0 || buckets.size > 10_000) {
            for (const [address, entry] of buckets) {
                if (entry.resetAt <= now) buckets.delete(address);
            }
            while (buckets.size > 10_000) buckets.delete(buckets.keys().next().value);
        }

        return next();
    };
};

module.exports = { createRateLimiter };
