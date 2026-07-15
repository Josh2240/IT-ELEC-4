const test = require('node:test');
const assert = require('node:assert/strict');

test('db module exposes a database status helper', () => {
  const db = require('../db');

  assert.equal(typeof db.getDatabaseStatus, 'function');
  const status = db.getDatabaseStatus();
  assert.equal(typeof status.connected, 'boolean');
  assert.equal(typeof status.message, 'string');
});
