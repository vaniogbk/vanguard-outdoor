// Hardening of the API surface: cache headers, malformed input, admin session rules, stock integrity, rate limits.
// Integration tests — require a Postgres database (DATABASE_URL). Run: npm test
// (own file = own process = own rate-limit counters, so exhausting a limiter here cannot disturb the other suites)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';

process.env.NODE_ENV = 'test';
process.env.PAYMENT_PROVIDERS = 'mock';

const { createApp } = await import('../src/app.js');
const { seed } = await import('../src/db/seed.js');
const { pool } = await import('../src/db/index.js');
const { hashPassword } = await import('../src/lib/auth.js');
const { errorHandler } = await import('../src/lib/http.js');

const app = createApp();
const xff = (n) => ({ 'X-Forwarded-For': `10.8.${Math.floor(n / 250)}.${n % 250}` });
const bearer = (t) => ({ Authorization: `Bearer ${t}` });
let customerToken, adminToken;

before(async () => {
  await seed({ log: () => {} });
  const email = `hard+${Date.now()}@example.com`;
  customerToken = (await request(app).post('/api/auth/register').set(xff(1)).send({ email, password: 'Sup3rSecret!' }).expect(201)).body.token;
  adminToken = (await request(app).post('/api/auth/login').set(xff(2)).send({ email: 'admin@vanguard.local', password: 'Admin1234!' }).expect(200)).body.token;
});
after(async () => { await pool.end(); });

test('cache: private answers are never stored, the public catalogue stays cacheable', async () => {
  for (const [path, headers] of [
    ['/api/auth/me', bearer(customerToken)], ['/api/auth/me', {}], ['/api/orders', bearer(customerToken)],
    ['/api/admin/stats', bearer(adminToken)], ['/api/admin/stats', bearer(customerToken)],
    ['/api/checkout/config', {}], ['/api/checkout/status/VG-0?token=x', {}], ['/api/newsletter/anything', {}],
  ]) {
    const r = await request(app).get(path).set(headers);
    assert.equal(r.headers['cache-control'], 'no-store', `${path} (${r.status})`);
  }
  const cat = await request(app).get('/api/products?limit=1').expect(200);
  assert.match(cat.headers['cache-control'], /public/, 'the catalogue keeps its public cache policy');
});

test('input: malformed catalogue query strings never end in a 500', async () => {
  const total = (await request(app).get('/api/products?limit=1').expect(200)).body.pagination.total;
  const harmless = [
    '/api/products?sort=__proto__', '/api/products?sort=constructor', '/api/products?sort=toString', '/api/products?sort=hasOwnProperty',
    '/api/products?sort[]=x', '/api/products?sort=a&sort=b',
    '/api/products?page=1e308', '/api/products?page=-3', '/api/products?page=abc', '/api/products?page=0', '/api/products?page=1.5',
    '/api/products?limit=-5', '/api/products?limit=1e999', '/api/products?limit=0',
    '/api/products?maxPrice=-1', '/api/products?minPrice=', `/api/products?category=${'a,'.repeat(500)}`, `/api/products?q=${'x'.repeat(5000)}`,
  ];
  for (const url of harmless) {
    const r = await request(app).get(url);
    assert.ok(r.status === 200, `${url.slice(0, 60)} → ${r.status}`);
  }
  // a price that is not a number is ignored, it does not filter everything out
  for (const url of ['/api/products?minPrice=abc', '/api/products?minPrice=1e999', '/api/products?maxPrice=NaN', '/api/products?minPrice=Infinity']) {
    const r = await request(app).get(`${url}&limit=1`).expect(200);
    assert.equal(r.body.pagination.total, total, `${url} must not change the result`);
  }
  const clamped = await request(app).get('/api/products?sort=constructor&page=1e308&limit=-5').expect(200);
  assert.equal(clamped.body.pagination.limit, 1);
  assert.equal(clamped.body.products.length, 0, 'a page far beyond the end is simply empty');
  // a real sort still works
  const asc = (await request(app).get('/api/products?sort=price-asc&limit=100').expect(200)).body.products.map((p) => p.priceCents);
  assert.deepEqual(asc, [...asc].sort((a, b) => a - b));
});

test('input: admin routes answer 404 for ids that are not uuids and cope with silly paging', async () => {
  const h = bearer(adminToken);
  for (const id of ['not-a-uuid', '123', '%00', '..%2F..%2Fetc', 'ffffffff-ffff-ffff-ffff-fffffffffffz']) {
    await request(app).get(`/api/admin/products/${id}`).set(h).expect(404);
    await request(app).get(`/api/admin/orders/${id}`).set(h).expect(404);
  }
  await request(app).put('/api/admin/products/xyz').set(h).send({}).expect(404);
  await request(app).patch('/api/admin/products/xyz').set(h).send({ status: 'draft' }).expect(404);
  await request(app).delete('/api/admin/products/xyz').set(h).expect(404);
  await request(app).patch('/api/admin/variants/xyz').set(h).send({ stock: 1 }).expect(404);
  await request(app).patch('/api/admin/orders/xyz').set(h).send({ status: 'shipped' }).expect(404);
  await request(app).get('/api/admin/products/00000000-0000-4000-8000-000000000000').set(h).expect(404); // a well-formed unknown id
  for (const url of ['/api/admin/orders?limit=-5', '/api/admin/orders?page=1e308', '/api/admin/orders?limit=abc&page=-2',
    '/api/admin/orders?status=nope,paid', `/api/admin/orders?q=${'x'.repeat(500)}`, '/api/admin/products?limit=-5&page=1e308',
    '/api/admin/customers?q=%25', `/api/admin/customers?q=${'x'.repeat(500)}`]) {
    await request(app).get(url).set(h).expect(200);
  }
});

test('errors: Postgres rejecting what the client sent is a 400 without the SQL message; real failures stay 500', () => {
  const { error, warn } = console;
  console.error = console.warn = () => {};
  try {
    const call = (err) => {
      const out = {};
      const res = { status(c) { out.status = c; return this; }, json(b) { out.body = b; return this; } };
      errorHandler(err, { method: 'GET', originalUrl: '/api/x?token=secret' }, res, () => {});
      return out;
    };
    for (const code of ['22P02', '22003', '2201X', '2201W']) {
      const out = call(Object.assign(new Error('invalid input syntax for type uuid: "x"'), { code }));
      assert.equal(out.status, 400, code);
      assert.equal(out.body.error, 'Invalid request parameter');
    }
    const down = call(Object.assign(new Error('connect ECONNREFUSED 10.0.0.1:5432'), { code: 'ECONNREFUSED' }));
    assert.equal(down.status, 500);
    assert.equal(down.body.error, 'Internal server error', 'internal details stay hidden');
    assert.equal(call(Object.assign(new Error('Payment provider unavailable'), { status: 502 })).status, 502, 'explicit statuses are kept');
  } finally {
    console.error = error;
    console.warn = warn;
  }
});

test('admin: sessions are short, and demoting or deleting an admin takes effect immediately', async () => {
  const email = `adm+${Date.now()}@example.com`;
  await pool.query(`INSERT INTO users(email, password_hash, role) VALUES ($1,$2,'admin')`, [email, await hashPassword('Adm1n-Passw0rd!')]);
  const login = await request(app).post('/api/auth/login').set(xff(3)).send({ email, password: 'Adm1n-Passw0rd!' }).expect(200);
  const t = login.body.token;
  const claims = jwt.decode(t);
  assert.equal(claims.exp - claims.iat, 12 * 3600, 'an admin token lasts 12 hours');
  const customer = jwt.decode(customerToken);
  assert.equal(customer.exp - customer.iat, 7 * 24 * 3600, 'a customer token keeps its 7 days');

  await request(app).get('/api/admin/stats').set(bearer(t)).expect(200);
  await pool.query(`UPDATE users SET role = 'customer' WHERE email = $1`, [email]);
  await request(app).get('/api/admin/stats').set(bearer(t)).expect(403); // still-valid token, role no longer admin
  await pool.query('DELETE FROM users WHERE email = $1', [email]);
  await request(app).get('/api/admin/stats').set(bearer(t)).expect(401); // account gone
});

test('stock: a paid order that exceeds the stock clamps it at zero and is flagged; the database refuses negative stock', async () => {
  const d = await request(app).get('/api/products/3-secs-tent').expect(200);
  const variant = d.body.product.variants[1];
  const before = (await pool.query('SELECT stock FROM product_variants WHERE id = $1', [variant.id])).rows[0].stock;
  try {
    const address = { firstName: 'Anna', lastName: 'Müller', line1: 'Hauptstraße 12', postalCode: '10115', city: 'Berlin', country: 'DE', phone: '+49301234567' };
    const r = await request(app).post('/api/checkout').set(xff(4)).send({
      items: [{ variantId: variant.id, quantity: 1 }], email: 'guest@example.com', shippingAddress: address, provider: 'mock', acceptTerms: true,
    }).expect(201);
    const { number, accessToken } = r.body.order;
    await pool.query('UPDATE product_variants SET stock = 0 WHERE id = $1', [variant.id]); // a competing buyer took the last unit
    const pay = await request(app).post(`/api/checkout/mock/${number}/pay`).send({ token: accessToken }).expect(200);
    assert.equal(pay.body.order.status, 'paid', 'the money is taken: the order is paid');
    assert.equal((await pool.query('SELECT stock FROM product_variants WHERE id = $1', [variant.id])).rows[0].stock, 0, 'stock is clamped, not -1');

    const ev = await pool.query(
      `SELECT e.data, e.visible_to_customer FROM order_events e JOIN orders o ON o.id = e.order_id WHERE o.number = $1 AND e.type = 'stock_shortfall'`, [number]);
    assert.equal(ev.rowCount, 1, 'the shortfall is recorded for the admin');
    assert.equal(ev.rows[0].visible_to_customer, false);
    assert.equal(ev.rows[0].data.lines[0].ordered, 1);
    assert.equal(ev.rows[0].data.lines[0].available, 0);
    const shown = await request(app).get(`/api/checkout/status/${number}?token=${accessToken}`).expect(200);
    assert.ok(!shown.body.order.events.some((e) => e.type === 'stock_shortfall'), 'the customer never sees internal events');
    const admin = await request(app).get(`/api/admin/orders/${shown.body.order.id}`).set(bearer(adminToken)).expect(200);
    assert.ok(admin.body.order.events.some((e) => e.type === 'stock_shortfall'), 'the admin does');

    await assert.rejects(pool.query('UPDATE product_variants SET stock = -1 WHERE id = $1', [variant.id]), /product_variants_stock_nonnegative/);
  } finally {
    await pool.query('UPDATE product_variants SET stock = $2 WHERE id = $1', [variant.id, before]);
  }
});

// keep these two last: they exhaust the limiters of this process
test('limits: the quote and order-status endpoints are rate limited per client', async () => {
  let last;
  for (let i = 0; i < 125; i++) last = await request(app).post('/api/checkout/quote').set(xff(5)).send({ items: [] }); // 400s count too
  assert.equal(last.status, 429, 'quote: more than 120 requests a minute from one client');
  for (let i = 0; i < 95; i++) last = await request(app).get('/api/checkout/status/VG-0?token=x').set(xff(6));
  assert.equal(last.status, 429, 'status: more than 90 requests a minute from one client');
  const other = await request(app).post('/api/checkout/quote').set(xff(7)).send({ items: [] });
  assert.equal(other.status, 400, 'another client is not affected');
});
