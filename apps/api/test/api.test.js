// Integration tests — require a Postgres database (DATABASE_URL). Run: npm test
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import request from 'supertest';
import adyenLib from '@adyen/api-library';

process.env.NODE_ENV = 'test';
process.env.PAYMENT_PROVIDERS = 'mock,adyen';
process.env.ADYEN_HMAC_KEY = '44782DEF547AAA06C910C43932B1EB0C71FC68D9D0C057550C48EC2ACF6BA056';

const { createApp } = await import('../src/app.js');
const { seed } = await import('../src/db/seed.js');
const { pool } = await import('../src/db/index.js');
const config = (await import('../src/config.js')).default;
const { unsubscribeToken } = await import('../src/lib/newsletter.js');
config.payments.adyen.hmacKey = process.env.ADYEN_HMAC_KEY;

const app = createApp();
const email = `test+${Date.now()}@example.com`;
let token, adminToken, variant, order;

before(async () => { await seed({ log: () => {} }); });
after(async () => { await pool.end(); });

const address = { firstName: 'Anna', lastName: 'Müller', line1: 'Hauptstraße 12', postalCode: '10115', city: 'Berlin', country: 'DE', phone: '+49301234567' };

test('health', async () => {
  const r = await request(app).get('/health').expect(200);
  assert.equal(r.body.ok, true);
});

test('catalog: list, filters, detail', async () => {
  const all = await request(app).get('/api/products?limit=100').expect(200);
  assert.ok(all.body.products.length >= 20);
  const cheap = await request(app).get('/api/products?maxPrice=50&limit=100').expect(200);
  assert.ok(cheap.body.products.every((p) => p.priceCents <= 5000));
  const tents = await request(app).get('/api/products?category=camping&locale=fr').expect(200);
  assert.ok(tents.body.products.every((p) => p.category.slug === 'camping'));
  const inStock = await request(app).get('/api/products?inStock=true&limit=100').expect(200);
  assert.ok(inStock.body.products.every((p) => p.inStock));
  assert.ok(inStock.body.products.length < all.body.products.length, 'out-of-stock product filtered');
  const kg = await request(app).get('/api/products?brand=kilos-gear&limit=100').expect(200);
  assert.ok(kg.body.products.every((p) => p.brand === 'kilos-gear'));
  const d = await request(app).get('/api/products/3-secs-tent?locale=de').expect(200);
  assert.equal(d.body.product.title, '3-Sekunden-Zelt');
  assert.equal(d.body.product.variants.length, 3);
  assert.equal(d.body.product.variants[0].stock, undefined, 'stock hidden from public');
  variant = d.body.product.variants[0];
});

test('auth: register, login, me, duplicate', async () => {
  const r = await request(app).post('/api/auth/register').send({ email, password: 'Sup3rSecret!', firstName: 'Anna', locale: 'de' }).expect(201);
  token = r.body.token;
  await request(app).post('/api/auth/register').send({ email, password: 'Sup3rSecret!' }).expect(409);
  await request(app).post('/api/auth/login').send({ email, password: 'wrong' }).expect(401);
  const l = await request(app).post('/api/auth/login').send({ email, password: 'Sup3rSecret!' }).expect(200);
  assert.ok(l.body.token);
  const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`).expect(200);
  assert.equal(me.body.user.email, email);
  await request(app).get('/api/auth/me').expect(401);
});

test('quote: server-side prices, Europe-only shipping, VAT', async () => {
  const q = await request(app).post('/api/checkout/quote').send({ items: [{ variantId: variant.id, quantity: 2 }], country: 'DE' }).expect(200);
  assert.equal(q.body.subtotalCents, variant.priceCents * 2);
  assert.equal(q.body.shippingCents, 0, 'free shipping above threshold in zone 1');
  assert.equal(q.body.vatRate, 19);
  await request(app).post('/api/checkout/quote').send({ items: [{ variantId: variant.id, quantity: 1 }], country: 'US' }).expect(400);
});

test('checkout with mock provider → paid → stock decremented → visible in history', async () => {
  const before = await pool.query('SELECT stock FROM product_variants WHERE id = $1', [variant.id]);
  const r = await request(app).post('/api/checkout').set('Authorization', `Bearer ${token}`).send({
    items: [{ variantId: variant.id, quantity: 1 }], email, shippingAddress: address, locale: 'de', provider: 'mock', acceptTerms: true,
  }).expect(201);
  order = r.body.order;
  assert.match(order.number, /^VG-\d+$/);
  assert.equal(r.body.payment.type, 'mock');

  await request(app).get(`/api/checkout/status/${order.number}?token=nope`).expect(403);
  const pay = await request(app).post(`/api/checkout/mock/${order.number}/pay`).send({ token: order.accessToken, outcome: 'success' }).expect(200);
  assert.equal(pay.body.order.status, 'paid');
  // idempotent
  await request(app).post(`/api/checkout/mock/${order.number}/pay`).send({ token: order.accessToken }).expect(200);
  const afterRow = await pool.query('SELECT stock FROM product_variants WHERE id = $1', [variant.id]);
  assert.equal(afterRow.rows[0].stock, before.rows[0].stock - 1);

  const list = await request(app).get('/api/orders').set('Authorization', `Bearer ${token}`).expect(200);
  assert.ok(list.body.orders.some((o) => o.number === order.number));
  const lookup = await request(app).post('/api/orders/lookup').send({ number: order.number, email }).expect(200);
  assert.equal(lookup.body.order.status, 'paid');
});

test('admin: forbidden for customers, ship order with tracking', async () => {
  await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${token}`).expect(403);
  const l = await request(app).post('/api/auth/login').send({ email: 'admin@vanguard.local', password: 'Admin1234!' }).expect(200);
  adminToken = l.body.token;
  const stats = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${adminToken}`).expect(200);
  assert.ok(stats.body.totals.orders >= 1);
  const u = await request(app).patch(`/api/admin/orders/${order.id}`).set('Authorization', `Bearer ${adminToken}`)
    .send({ carrier: 'dhl', trackingNumber: 'JD014600003SE' }).expect(200);
  assert.equal(u.body.order.status, 'shipped');
  assert.match(u.body.order.trackingUrl, /dhl\.com/);
  const mine = await request(app).get(`/api/orders/${order.number}`).set('Authorization', `Bearer ${token}`).expect(200);
  assert.ok(mine.body.order.events.some((e) => e.type === 'shipped'));
});

test('admin: create, update and archive a product', async () => {
  const cats = await request(app).get('/api/admin/categories').set('Authorization', `Bearer ${adminToken}`).expect(200);
  const body = {
    brand: 'vanguard', categoryId: cats.body.categories[0].id, title: { en: `Test Tarp ${Date.now()}`, fr: 'Bâche test', de: 'Testplane' },
    images: [], variants: [{ sku: `VG-T-${Date.now()}`, title: 'Default', priceCents: 1999, stock: 3 }],
  };
  const c = await request(app).post('/api/admin/products').set('Authorization', `Bearer ${adminToken}`).send(body).expect(201);
  const id = c.body.product.id;
  body.variants[0].id = c.body.product.variants[0].id;
  body.variants[0].priceCents = 2499;
  const u = await request(app).put(`/api/admin/products/${id}`).set('Authorization', `Bearer ${adminToken}`).send(body).expect(200);
  assert.equal(u.body.product.variants[0].priceCents, 2499);
  await request(app).delete(`/api/admin/products/${id}`).set('Authorization', `Bearer ${adminToken}`).expect(200);
});

// Adyen is not configured in the test run, so orders are created through the mock provider and then re-labelled as Adyen orders
async function adyenOrder(email = 'guest@example.com') {
  const r = await request(app).post('/api/checkout').send({
    items: [{ variantId: variant.id, quantity: 1 }], email, shippingAddress: { ...address, country: 'FR' }, provider: 'mock', acceptTerms: true,
  }).expect(201);
  await pool.query(`UPDATE orders SET payment_provider = 'adyen' WHERE number = $1`, [r.body.order.number]);
  return r.body.order;
}
const signedAdyenItem = (order, over = {}) => {
  const item = {
    pspReference: `PSP${Date.now()}${Math.floor(Math.random() * 1e6)}`, originalReference: '', merchantAccountCode: 'TestMerchant', merchantReference: order.number,
    amount: { value: order.totalCents, currency: 'EUR' }, eventCode: 'AUTHORISATION', success: 'true', additionalData: {}, ...over,
  };
  const sig = new adyenLib.hmacValidator().calculateHmac(item, process.env.ADYEN_HMAC_KEY);
  return { live: 'false', notificationItems: [{ NotificationRequestItem: { ...item, additionalData: { hmacSignature: sig } } }] };
};
const orderStatus = async (o) => (await request(app).get(`/api/checkout/status/${o.number}?token=${o.accessToken}`).expect(200)).body.order.status;

test('adyen webhook: rejects bad HMAC, accepts signed AUTHORISATION', async () => {
  const order = await adyenOrder();
  const item = {
    pspReference: `PSP${Date.now()}`, originalReference: '', merchantAccountCode: 'TestMerchant', merchantReference: order.number,
    amount: { value: order.totalCents, currency: 'EUR' }, eventCode: 'AUTHORISATION', success: 'true',
    additionalData: {},
  };
  await request(app).post('/api/webhooks/adyen').send({ live: 'false', notificationItems: [{ NotificationRequestItem: { ...item, additionalData: { hmacSignature: 'bad' } } }] }).expect(401);
  const ok = await request(app).post('/api/webhooks/adyen').send(signedAdyenItem(order)).expect(200);
  assert.equal(ok.text, '[accepted]');
  assert.equal(await orderStatus(order), 'paid');
});

test('adyen webhook: an authorisation for another amount does not settle the order', async () => {
  const order = await adyenOrder();
  await request(app).post('/api/webhooks/adyen').send(signedAdyenItem(order, { amount: { value: 1, currency: 'EUR' } })).expect(200);
  assert.equal(await orderStatus(order), 'pending_payment');
  await request(app).post('/api/webhooks/adyen').send(signedAdyenItem(order, { amount: { value: order.totalCents, currency: 'USD' } })).expect(200);
  assert.equal(await orderStatus(order), 'pending_payment', 'wrong currency');
  const flagged = await pool.query(`SELECT count(*)::int AS n FROM order_events e JOIN orders o ON o.id = e.order_id WHERE o.number = $1 AND e.type = 'payment_amount_mismatch' AND NOT e.visible_to_customer`, [order.number]);
  assert.equal(flagged.rows[0].n, 2, 'each mismatch leaves a hidden event for the admin');
  await request(app).post('/api/webhooks/adyen').send(signedAdyenItem(order)).expect(200);
  assert.equal(await orderStatus(order), 'paid', 'the genuine authorisation still works afterwards');
});

test('adyen webhook: cannot settle an order that belongs to another payment provider', async () => {
  const r = await request(app).post('/api/checkout').send({
    items: [{ variantId: variant.id, quantity: 1 }], email: 'guest2@example.com', shippingAddress: { ...address, country: 'FR' }, provider: 'mock', acceptTerms: true,
  }).expect(201); // stays a "mock" order
  await request(app).post('/api/webhooks/adyen').send(signedAdyenItem(r.body.order)).expect(200);
  assert.equal(await orderStatus(r.body.order), 'pending_payment');
});

// ───────────── security hardening ─────────────
// every request below comes from a different "client" IP, so only the per-account limiter can be what answers 429
const xff = (n) => ({ 'X-Forwarded-For': `10.9.${Math.floor(n / 250)}.${n % 250}` });

test('seed: an account registered before the admin existed cannot keep control of the admin e-mail', async () => {
  const adminEmail = `owner+${Date.now()}@example.com`;
  await request(app).post('/api/auth/register').set(xff(1)).send({ email: adminEmail, password: 'attacker-pass-123' }).expect(201);
  config.admin.email = adminEmail;
  config.admin.password = 'Owner-Legit-Pass-123!';
  try { await seed({ log: () => {} }); } finally { config.admin.email = ''; config.admin.password = ''; }
  await request(app).post('/api/auth/login').set(xff(2)).send({ email: adminEmail, password: 'attacker-pass-123' }).expect(401);
  const ok = await request(app).post('/api/auth/login').set(xff(3)).send({ email: adminEmail, password: 'Owner-Legit-Pass-123!' }).expect(200);
  assert.equal(ok.body.user.role, 'admin');
});

test('login: an unknown e-mail costs as much as a wrong password (no account-existence oracle)', async () => {
  const attempt = async (body, n) => {
    const start = performance.now();
    await request(app).post('/api/auth/login').set(xff(10 + n)).send(body).expect(401);
    return performance.now() - start;
  };
  const known = await attempt({ email, password: 'wrong-password' }, 1);
  const unknown = await attempt({ email: `nobody+${Date.now()}@example.com`, password: 'wrong-password' }, 2);
  assert.ok(unknown > known * 0.5, `unknown account answered in ${unknown.toFixed(0)} ms, known account in ${known.toFixed(0)} ms`);
});

test('login: legacy bcrypt hashes still work and are upgraded to scrypt', async () => {
  const bcrypt = (await import('bcryptjs')).default;
  const legacyEmail = `legacy+${Date.now()}@example.com`;
  await pool.query('INSERT INTO users(email, password_hash) VALUES ($1,$2)', [legacyEmail, await bcrypt.hash('Legacy-Pass-123!', 4)]);
  await request(app).post('/api/auth/login').set(xff(20)).send({ email: legacyEmail, password: 'wrong' }).expect(401);
  await request(app).post('/api/auth/login').set(xff(21)).send({ email: legacyEmail, password: 'Legacy-Pass-123!' }).expect(200);
  const { rows } = await pool.query('SELECT password_hash FROM users WHERE email = $1', [legacyEmail]);
  assert.match(rows[0].password_hash, /^scrypt\$15\$8\$1\$/);
  await request(app).post('/api/auth/login').set(xff(22)).send({ email: legacyEmail, password: 'Legacy-Pass-123!' }).expect(200);
});

test('login: failed attempts against one account are throttled even when they come from many IPs', async () => {
  const target = `victim+${Date.now()}@example.com`;
  const codes = [];
  for (let i = 0; i < 22; i++) codes.push((await request(app).post('/api/auth/login').set(xff(100 + i)).send({ email: target, password: 'guess' })).status);
  assert.deepEqual([...new Set(codes.slice(0, 20))], [401], 'the first 20 failures are answered normally');
  assert.equal(codes[20], 429, 'the 21st is refused');
});

test('payoneer webhook: 404 while disabled; when enabled it needs its own strong secret and the order\'s longId', async () => {
  const payoneer = config.payments.payoneer;
  const savedProviders = config.payments.providers;
  const saved = { ...payoneer };
  const SECRET = crypto.randomBytes(24).toString('hex');
  const r = await request(app).post('/api/checkout').send({
    items: [{ variantId: variant.id, quantity: 1 }], email: 'payo@example.com', shippingAddress: { ...address, country: 'FR' }, provider: 'mock', acceptTerms: true,
  }).expect(201);
  const order = r.body.order;
  await pool.query(`UPDATE orders SET payment_provider = 'payoneer', payment_session_id = 'LONG-1' WHERE number = $1`, [order.number]);
  const hit = (q) => request(app).get('/api/webhooks/payoneer').query({ transactionId: order.number, statusCode: 'charged', ...q });

  await hit({ s: SECRET, longId: 'LONG-1' }).expect(404); // Payoneer is not enabled: the route does not exist
  Object.assign(payoneer, { merchantCode: 'M', apiToken: 'T', notificationSecret: SECRET });
  config.payments.providers = ['mock', 'payoneer'];
  try {
    await hit({ s: 'wrong', longId: 'LONG-1' }).expect(401);
    const jwtDerived = crypto.createHash('sha256').update(`:${config.jwtSecret}`).digest('hex').slice(0, 32);
    await hit({ s: jwtDerived, longId: 'LONG-1' }).expect(401); // the old secret derived from JWT_SECRET is worthless now
    await hit({ s: SECRET }).expect(400); // longId is mandatory
    await hit({ s: SECRET, longId: 'SOMEONE-ELSES' }).expect(400);
    assert.equal(await orderStatus(order), 'pending_payment');
    await hit({ s: SECRET, longId: 'LONG-1' }).expect(200);
    assert.equal(await orderStatus(order), 'paid');
    await request(app).get('/api/webhooks/payoneer').query({ s: SECRET, transactionId: 'VG-999999', longId: 'x', statusCode: 'charged' }).expect(200); // unknown order: acknowledged, nothing to settle
  } finally {
    Object.assign(payoneer, saved);
    config.payments.providers = savedProviders;
  }
});

test('newsletter: an opt-out is final and the unsubscribe link is signed', async () => {
  const address2 = `news+${Date.now()}@example.com`;
  const row = async () => (await pool.query('SELECT unsubscribed_at FROM newsletter_subscribers WHERE email = $1', [address2])).rows[0];
  await request(app).post('/api/newsletter').send({ email: address2, locale: 'fr' }).expect(201);
  assert.equal((await row()).unsubscribed_at, null);
  await request(app).post('/api/newsletter/unsubscribe').send({ email: address2, token: 'x'.repeat(32) }).expect(400);
  await request(app).post('/api/newsletter/unsubscribe').send({ email: address2, token: unsubscribeToken(address2) }).expect(200);
  assert.ok((await row()).unsubscribed_at);
  await request(app).post('/api/newsletter').send({ email: address2, locale: 'en' }).expect(201); // same answer as for anyone else…
  assert.ok((await row()).unsubscribed_at, '…but typing the address again does not re-enrol it');
});
