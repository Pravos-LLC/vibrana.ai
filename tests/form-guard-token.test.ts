import { test } from 'vitest';
import assert from 'node:assert/strict';
import { createFormToken, verifyFormToken } from '@/lib/form-guard/token';

const SECRET = 'test-secret';
const OPTS = { maxAgeMs: 12 * 60 * 60 * 1000, futureSkewMs: 30_000 };

test('a fresh token verifies and reports its age', () => {
  const issued = 1_780_000_000_000;
  const token = createFormToken(SECRET, issued);
  const result = verifyFormToken(token, SECRET, { ...OPTS, now: issued + 4000 });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.issuedAt, issued);
    assert.equal(result.ageMs, 4000);
    assert.match(result.nonce, /^[A-Za-z0-9_-]{16}$/);
  }
});

test('missing and malformed tokens are rejected', () => {
  assert.deepEqual(verifyFormToken(undefined, SECRET, OPTS), { ok: false, reason: 'missing' });
  assert.deepEqual(verifyFormToken('', SECRET, OPTS), { ok: false, reason: 'missing' });
  assert.deepEqual(verifyFormToken('abc', SECRET, OPTS), { ok: false, reason: 'malformed' });
  assert.deepEqual(verifyFormToken('v1.notanumber.abcdefghij.sig', SECRET, OPTS), { ok: false, reason: 'malformed' });
  assert.deepEqual(verifyFormToken('x'.repeat(500), SECRET, OPTS), { ok: false, reason: 'malformed' });
});

test('a bot cannot backdate the timestamp to skip the fill-time check', () => {
  const now = 1_780_000_000_000;
  const token = createFormToken(SECRET, now);
  const [v, , nonce, sig] = token.split('.');
  const backdated = [v, String(now - 60_000), nonce, sig].join('.');
  assert.deepEqual(verifyFormToken(backdated, SECRET, { ...OPTS, now }), { ok: false, reason: 'bad-signature' });
});

test('a token signed with another secret is rejected', () => {
  const token = createFormToken('other-secret');
  assert.deepEqual(verifyFormToken(token, SECRET, OPTS), { ok: false, reason: 'bad-signature' });
});

test('expired and future tokens are rejected', () => {
  const issued = 1_780_000_000_000;
  const token = createFormToken(SECRET, issued);
  assert.deepEqual(
    verifyFormToken(token, SECRET, { ...OPTS, now: issued + OPTS.maxAgeMs + 1 }),
    { ok: false, reason: 'expired' },
  );
  assert.deepEqual(
    verifyFormToken(token, SECRET, { ...OPTS, now: issued - 60_000 }),
    { ok: false, reason: 'future' },
  );
});
