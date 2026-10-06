// Security building blocks that need neither a database nor the HTTP app.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

process.env.NODE_ENV = 'test';
const apiDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { hashPassword, verifyPassword, needsRehash } = await import('../src/lib/auth.js');
const { redactUrl } = await import('../src/lib/http.js');
const { safeEqual } = await import('../src/lib/secure.js');
const { assertStrongSecret } = await import('../src/config.js');

test('passwords: scrypt hashes verify, are salted, normalised and flagged for upgrade when parameters change', async () => {
  const h = await hashPassword('Correct-Horse-1');
  assert.match(h, /^scrypt\$15\$8\$1\$[\w-]+\$[\w-]+$/);
  assert.equal(await verifyPassword('Correct-Horse-1', h), true);
  assert.equal(await verifyPassword('Correct-Horse-2', h), false);
  assert.notEqual(await hashPassword('Correct-Horse-1'), h, 'a fresh salt for every hash');
  assert.equal(await verifyPassword('café', await hashPassword('café')), true, 'composed and decomposed accents are the same password');
  assert.equal(needsRehash(h), false);
  assert.equal(needsRehash('$2b$12$abcdefghijklmnopqrstuv'), true, 'legacy bcrypt');
  assert.equal(needsRehash('scrypt$14$8$1$salt$key'), true, 'cheaper scrypt parameters');
});

test('passwords: legacy bcrypt hashes verify, malformed stored values never do', async () => {
  const bcrypt = (await import('bcryptjs')).default;
  assert.equal(await verifyPassword('Legacy-1', await bcrypt.hash('Legacy-1', 4)), true);
  for (const bad of ['', 'scrypt$', 'garbage', null, undefined, 'scrypt$15$8$1$only-a-salt']) assert.equal(await verifyPassword('x', bad), false);
});

test('safeEqual: constant-time comparison that tolerates anything', () => {
  assert.equal(safeEqual('abc', 'abc'), true);
  assert.equal(safeEqual('abc', 'abd'), false);
  assert.equal(safeEqual('abc', 'abcd'), false);
  assert.equal(safeEqual(undefined, 'x'), false);
  assert.equal(safeEqual(undefined, undefined), true, 'both empty is not a secret');
});

test('logs: tokens, secrets, payment results and e-mail addresses are removed from URLs', () => {
  assert.equal(redactUrl('/api/checkout/status/VG-1?token=abc123&sessionResult=zzz&x=1'), '/api/checkout/status/VG-1?token=[redacted]&sessionResult=[redacted]&x=1');
  assert.equal(redactUrl('/api/webhooks/payoneer?s=SECRET&transactionId=VG-1'), '/api/webhooks/payoneer?s=[redacted]&transactionId=VG-1');
  assert.equal(redactUrl('/api/newsletter?e=a%40b.com&t=tok'), '/api/newsletter?e=[redacted]&t=[redacted]');
  assert.equal(redactUrl('/api/products?q=tent&sort=price-asc&page=2'), '/api/products?q=tent&sort=price-asc&page=2', 'harmless parameters are untouched');
  assert.equal(redactUrl(undefined), '');
});

test('config: a weak or copied-from-the-docs secret is rejected, a random one accepted', () => {
  for (const weak of ['short', 'change-me-with-a-long-random-string', 'dev-only-secret-change-me-xxxxxxxxxxxxxxxx', 'a'.repeat(64), 'ci-secret'.padEnd(40, 'x'), 'MyPassword1234567890123456789012345']) {
    assert.throws(() => assertStrongSecret('JWT_SECRET', weak), /JWT_SECRET must be a random value/, weak);
  }
  const strong = 'f3a9c1e07b24d85e61fa0b93c7d2e48a5b16f90c3d7a82e4b50c19f6a3d87e2c4b9f01a6d35e87c2';
  assert.equal(assertStrongSecret('JWT_SECRET', strong), strong);
});

test('config: in production the API refuses to start with a weak JWT_SECRET (and starts with a strong one)', () => {
  const strong = 'f3a9c1e07b24d85e61fa0b93c7d2e48a5b16f90c3d7a82e4b50c19f6a3d87e2c4b9f01a6d35e87c2';
  const boot = (env) => spawnSync(process.execPath, ['-e', "import('./src/config.js').then(() => console.log('BOOT_OK'))"], {
    cwd: apiDir, encoding: 'utf8',
    env: { ...process.env, NODE_ENV: 'production', DATABASE_URL: 'postgresql://u:p@localhost:5432/db', PAYONEER_NOTIFICATION_SECRET: '', ...env },
  });
  const placeholder = boot({ JWT_SECRET: 'change-me-with-a-long-random-string' });
  assert.notEqual(placeholder.status, 0);
  assert.match(placeholder.stderr, /JWT_SECRET must be a random value/);
  assert.match(boot({ JWT_SECRET: '' }).stderr, /Missing required environment variable: JWT_SECRET/);
  assert.match(boot({ JWT_SECRET: strong, PAYONEER_NOTIFICATION_SECRET: 'weak' }).stderr, /PAYONEER_NOTIFICATION_SECRET must be a random value/);
  const ok = boot({ JWT_SECRET: strong });
  assert.equal(ok.status, 0, ok.stderr);
  assert.match(ok.stdout, /BOOT_OK/);
});

test('deployment: the container does not run as root and installs exactly what the lockfile says', async () => {
  const fs = await import('node:fs');
  // comments may quote the very commands we forbid, so only the instructions are checked
  const dockerfile = fs.readFileSync(path.join(apiDir, 'Dockerfile'), 'utf8')
    .split(/\r?\n/).filter((l) => !l.trim().startsWith('#')).join('\n');
  assert.match(dockerfile, /^USER node$/m, 'the API must not run as root');
  assert.match(dockerfile, /npm ci --omit=dev/);
  assert.doesNotMatch(dockerfile, /\|\|\s*npm install/, 'no silent fallback to an install that ignores the lockfile');
  const compose = fs.readFileSync(path.join(apiDir, '..', '..', 'docker-compose.yml'), 'utf8');
  assert.doesNotMatch(compose, /ports:\s*\["\d+:\d+"\]/, 'local services are published on 127.0.0.1 only');
});
