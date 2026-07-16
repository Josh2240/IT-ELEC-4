const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

test('auth middleware allows a valid bearer token', () => {
  const token = jwt.sign({ id: 1, email: 'admin@example.com' }, 'dev-secret-please-change');
  const req = {
    headers: {
      authorization: `Bearer ${token}`
    }
  };
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };

  let nextCalled = false;
  auth(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, null);
  assert.equal(req.user.email, 'admin@example.com');
});
