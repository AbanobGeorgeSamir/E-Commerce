const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

require('dotenv').config({ quiet: true });

test('JWT signing secret is supplied by the local environment', () => {
    assert.ok(process.env.JWT_SECRET, 'JWT_SECRET must be configured in backend/.env');
    assert.ok(process.env.JWT_SECRET.length >= 32, 'JWT_SECRET must be at least 32 characters');

    const token = jwt.sign({ userId: 'environment-test' }, process.env.JWT_SECRET, { expiresIn: '1m' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    assert.equal(payload.userId, 'environment-test');
});
