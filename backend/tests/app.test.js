const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-local-validation';
const { normalizeMongoUri } = require('../config/db');
const app = require('../server');

const makeRequest = (server, path, headers = {}) => new Promise((resolve, reject) => {
    const request = http.request({
        host: '127.0.0.1',
        port: server.address().port,
        path,
        headers,
    }, (response) => {
        let body = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => { body += chunk; });
        response.on('end', () => resolve({ response, body }));
    });
    request.on('error', reject);
    request.end();
});

test('normalizeMongoUri forces the ecommerce database name', () => {
    const uri = 'mongodb+srv://user:pass@cluster0.mongodb.net';
    const normalized = normalizeMongoUri(uri);

    assert.match(normalized, /\/ecommerce(?:\?|$)/);
});

test('unknown routes return a JSON 404 with production safety headers', async (t) => {
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    t.after(() => server.close());

    const { response, body } = await makeRequest(server, '/missing');

    assert.equal(response.statusCode, 404);
    assert.equal(response.headers['content-type'], 'application/json; charset=utf-8');
    assert.equal(response.headers['x-content-type-options'], 'nosniff');
    assert.equal(JSON.parse(body).message, 'Route not found.');
});
