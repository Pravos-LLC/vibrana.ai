import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
  cleanSource,
  cleanText,
  isRandomCaseToken,
  isValidEmail,
  looksLikeGibberishMessage,
  looksLikeGibberishName,
  normalizeEmail,
} from '@/lib/form-guard/validation';

test('normalizeEmail trims and lowercases', () => {
  assert.equal(normalizeEmail('  John@Example.COM \n'), 'john@example.com');
  assert.equal(normalizeEmail(undefined), '');
  assert.equal(normalizeEmail(42), '');
});

test('isValidEmail accepts real addresses', () => {
  for (const email of [
    'john@john-ellison.com',
    'first.last+tag@sub.example.co.uk',
    "o'brien@example.ie",
    'a@b.io',
  ]) {
    assert.ok(isValidEmail(email), email);
  }
});

test('isValidEmail rejects junk the old includes("@") check let through', () => {
  for (const email of [
    '@',
    'a@',
    '@b.com',
    'a@b',
    'a b@c.com',
    'a@b..com',
    'a@-b.com',
    'a@b.c',
    '.a@b.com',
    'a..b@c.com',
    'a@b.com<script>',
    `${'a'.repeat(65)}@b.com`,
    `a@${'b'.repeat(250)}.com`,
  ]) {
    assert.equal(isValidEmail(email), false, email);
  }
});

test('cleanText trims, allows missing, rejects non-strings and over-length', () => {
  assert.equal(cleanText('  hi  ', 10), 'hi');
  assert.equal(cleanText(undefined, 10), '');
  assert.equal(cleanText(null, 10), '');
  assert.equal(cleanText({}, 10), null);
  assert.equal(cleanText('x'.repeat(11), 10), null);
});

test('cleanSource only accepts short slug-like tags', () => {
  assert.equal(cleanSource('exit-intent-popup', 'website'), 'exit-intent-popup');
  assert.equal(cleanSource('In-Post', 'footer'), 'in-post');
  assert.equal(cleanSource('<script>', 'footer'), 'footer');
  assert.equal(cleanSource('x'.repeat(80), 'footer'), 'footer');
  assert.equal(cleanSource(undefined, 'footer'), 'footer');
});

test('random mixed-case tokens from the contact_submissions audit are flagged', () => {
  assert.ok(isRandomCaseToken('lGMsBDsjkWZFWATJvjybI'));
  assert.ok(isRandomCaseToken('CznelGIzvRhtMHdqBrDSbf'));
  assert.ok(looksLikeGibberishName('lGMsBDsjkWZFWATJvjybI'));
  assert.ok(looksLikeGibberishMessage('CznelGIzvRhtMHdqBrDSbf'));
});

test('real names are not flagged', () => {
  for (const name of [
    'John Ellison',
    'McDonald',
    'DeShawn MacKenzie',
    'Fatma Ghedira',
    'Mary-Jane O\'Neil',
    'Chetan Nanda Kumar',
    'Jean-Christophe Vanderberghe',
    'Bartholomew',
    'Nguyễn Thị Minh Khai',
    '李小龙',
    'VanDerBerg',
  ]) {
    assert.equal(looksLikeGibberishName(name), false, name);
  }
});

test('names with no vowels in one long run are flagged', () => {
  assert.ok(looksLikeGibberishName('xkcdqwrtzpfg'));
});

test('real messages are not flagged', () => {
  for (const message of [
    'Hi John, would love to chat about an AI sprint for our ops team.',
    'Call me',
    'Interested in the AI Build Sprint. Budget is approved for Q4.',
    'Quick question about pricing?\nThanks',
  ]) {
    assert.equal(looksLikeGibberishMessage(message), false, message);
  }
});

test('messages with no spaces or mostly random tokens are flagged', () => {
  assert.ok(looksLikeGibberishMessage('hello'));
  assert.ok(looksLikeGibberishMessage('https://spam.example.com/buy-now'));
  assert.ok(looksLikeGibberishMessage('   '));
  assert.ok(looksLikeGibberishMessage('aBcDeFgHiJkL MnOpQrStUvWx'));
});
