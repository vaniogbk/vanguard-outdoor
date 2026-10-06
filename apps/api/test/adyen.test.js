// Unit tests for the Adyen integration (no database, no network): Klarna-ready basket + return-URL verification.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import adyenLib from '@adyen/api-library';

process.env.NODE_ENV = 'test';
const config = (await import('../src/config.js')).default;
const { default: adyen, taxSplit, buildLineItems, buildSessionRequest, adyenAddress, _testing } = await import('../src/payments/adyen.js');

const items = [
  { id: 'i1', sku: 'RO-1', title: 'Tente 3 secondes', variant_title: 'Grande', quantity: 1, unit_price_cents: 8999, image: 'https://cdn.shopify.com/x.jpg' },
  { id: 'i2', sku: 'KG-2', title: 'Lampe', variant_title: null, quantity: 2, unit_price_cents: 750, image: null },
];
const order = (over = {}) => ({
  id: 'o-1', number: 'VG-100500', user_id: null, email: 'anna@example.eu', locale: 'fr', currency: 'EUR', vat_rate: '20.00',
  shipping_cents: 590, shipping_method: 'standard', subtotal_cents: 10499, total_cents: 11089,
  shipping_address: { firstName: 'Anna', lastName: 'Müller', line1: 'Hauptstraße 12', line2: '', postalCode: '10115', city: 'Berlin', country: 'DE', phone: '' },
  ...over,
});
const basketTotal = (lines) => lines.reduce((s, l) => s + l.quantity * l.amountIncludingTax, 0);

test('taxSplit: VAT-inclusive amount → net + tax, rate in basis points', () => {
  assert.deepEqual(taxSplit(12000, 20), { amountIncludingTax: 12000, amountExcludingTax: 10000, taxAmount: 2000, taxPercentage: 2000 });
  assert.deepEqual(taxSplit(1000, 0), { amountIncludingTax: 1000, amountExcludingTax: 1000, taxAmount: 0, taxPercentage: 0 });
  assert.equal(taxSplit(1000, '25.50').taxPercentage, 2550, 'Finland 25.5 %');
});

test('klarna basket: products + shipping add up exactly to the order total', () => {
  const lines = buildLineItems(order(), items);
  assert.equal(lines.length, 3);
  assert.equal(lines.at(-1).id, 'shipping');
  assert.equal(basketTotal(lines), 11089, 'Σ quantity × amountIncludingTax = amount.value (Klarna rejects anything else)');
  for (const l of lines) {
    assert.ok(l.description, 'every line needs a description');
    assert.equal(l.amountExcludingTax + l.taxAmount, l.amountIncludingTax);
    assert.equal(l.taxPercentage, 2000);
  }
  assert.equal(lines[0].imageUrl, 'https://cdn.shopify.com/x.jpg');
  assert.equal(lines[1].imageUrl, undefined);
});

test('klarna basket: free shipping adds no shipping line; non-EU destination carries no VAT', () => {
  const free = buildLineItems(order({ shipping_cents: 0, total_cents: 10499 }), items);
  assert.equal(free.length, 2);
  assert.equal(basketTotal(free), 10499);
  const gb = buildLineItems(order({ vat_rate: '0.00' }), items);
  assert.ok(gb.every((l) => l.taxPercentage === 0 && l.taxAmount === 0 && l.amountExcludingTax === l.amountIncludingTax));
});

test('klarna basket: very long product names are clipped', () => {
  const [line] = buildLineItems(order(), [{ ...items[0], title: 'X'.repeat(500) }]);
  assert.ok(line.description.length <= 200);
});

test('adyenAddress: house number is separated from the street when it can be done safely', () => {
  const a = (line1, line2 = '') => adyenAddress({ line1, line2, postalCode: '1', city: 'c', country: 'DE' });
  assert.deepEqual([a('Hauptstraße 12').street, a('Hauptstraße 12').houseNumberOrName], ['Hauptstraße', '12']);
  assert.deepEqual([a('12 rue de Rivoli').street, a('12 rue de Rivoli').houseNumberOrName], ['rue de Rivoli', '12']);
  assert.deepEqual([a('Calle Mayor, 5', 'Piso 2').street, a('Calle Mayor, 5', 'Piso 2').houseNumberOrName], ['Calle Mayor', '5 Piso 2']);
  assert.equal(a('Route de Genève 123-125').houseNumberOrName, '123-125');
  assert.deepEqual([a('Lieu-dit Les Pins').street, a('Lieu-dit Les Pins').houseNumberOrName], ['Lieu-dit Les Pins', '-'], 'unknown pattern keeps the previous behaviour');
});

test('session request: billing + delivery address, shopper identity and a complete basket', () => {
  const o = order({ user_id: 'u-1', shipping_address: { ...order().shipping_address, phone: '+49301234567' } });
  const body = buildSessionRequest(o, items, 'https://shop.example/fr/checkout/return?order=VG-100500');
  assert.deepEqual(body.billingAddress, body.deliveryAddress);
  assert.equal(body.billingAddress.country, 'DE');
  assert.equal(body.countryCode, 'DE');
  assert.equal(body.shopperLocale, 'fr-FR');
  assert.deepEqual(body.shopperName, { firstName: 'Anna', lastName: 'Müller' });
  assert.equal(body.shopperEmail, 'anna@example.eu');
  assert.equal(body.shopperReference, 'u-1');
  assert.deepEqual(body.amount, { value: 11089, currency: 'EUR' });
  assert.equal(body.reference, 'VG-100500');
  assert.equal(basketTotal(body.lineItems), body.amount.value);
});

// ───────────── return-URL verification ─────────────
const fakeApi = (response) => ({ PaymentsApi: { paymentsDetails: async () => response, getResultOfPaymentSession: async () => response } });
const good = { resultCode: 'Authorised', merchantReference: 'VG-100500', amount: { value: 11089, currency: 'EUR' } };

test('redirectResult: accepted only for the order it was made for', async () => {
  const o = order();
  _testing.setApi(fakeApi(good));
  assert.equal(await adyen.verifyReturn({ order: o, redirectResult: 'r' }), 'paid');

  // the shopper replays the result of a cheap payment (another order) against a more expensive pending order
  _testing.setApi(fakeApi({ ...good, merchantReference: 'VG-100001', amount: { value: 500, currency: 'EUR' } }));
  assert.equal(await adyen.verifyReturn({ order: o, redirectResult: 'r' }), null, 'other order');
  _testing.setApi(fakeApi({ ...good, amount: { value: 500, currency: 'EUR' } }));
  assert.equal(await adyen.verifyReturn({ order: o, redirectResult: 'r' }), null, 'right reference, wrong amount');
  _testing.setApi(fakeApi({ ...good, amount: { value: 11089, currency: 'USD' } }));
  assert.equal(await adyen.verifyReturn({ order: o, redirectResult: 'r' }), null, 'wrong currency');
  _testing.setApi(fakeApi({ resultCode: 'Authorised', merchantReference: 'VG-100500' }));
  assert.equal(await adyen.verifyReturn({ order: o, redirectResult: 'r' }), null, 'an authorisation without amount is not trusted');
});

test('redirectResult: refused / cancelled / pending outcomes for the right order', async () => {
  const o = order();
  const result = async (resultCode) => { _testing.setApi(fakeApi({ resultCode, merchantReference: 'VG-100500' })); return adyen.verifyReturn({ order: o, redirectResult: 'r' }); };
  assert.equal(await result('Refused'), 'failed');
  assert.equal(await result('Error'), 'failed');
  assert.equal(await result('Cancelled'), 'cancelled');
  assert.equal(await result('Pending'), null);
  assert.equal(await result('Received'), null);
});

test('sessionResult: the session reference must be the order number', async () => {
  const o = order();
  _testing.setApi(fakeApi({ id: 'CS1', reference: 'VG-100500', status: 'completed' }));
  assert.equal(await adyen.verifyReturn({ order: o, sessionId: 'CS1', sessionResult: 's' }), 'paid');
  _testing.setApi(fakeApi({ id: 'CS1', reference: 'VG-999999', status: 'completed' }));
  assert.equal(await adyen.verifyReturn({ order: o, sessionId: 'CS1', sessionResult: 's' }), null);
  _testing.setApi(fakeApi({ id: 'CS1', reference: 'VG-100500', status: 'refused' }));
  assert.equal(await adyen.verifyReturn({ order: o, sessionId: 'CS1', sessionResult: 's' }), 'failed');
  assert.equal(await adyen.verifyReturn({ order: o }), null, 'nothing to verify');
});

// ───────────── webhook parsing ─────────────
test('webhook: events carry the authorised amount; foreign merchant accounts are acknowledged but ignored', () => {
  const KEY = '44782DEF547AAA06C910C43932B1EB0C71FC68D9D0C057550C48EC2ACF6BA056';
  const saved = { ...config.payments.adyen };
  Object.assign(config.payments.adyen, { hmacKey: KEY, merchantAccount: 'VanguardShop' });
  try {
    const sign = (item) => ({ NotificationRequestItem: { ...item, additionalData: { hmacSignature: new adyenLib.hmacValidator().calculateHmac(item, KEY) } } });
    const base = { pspReference: 'P1', originalReference: '', merchantReference: 'VG-100500', amount: { value: 11089, currency: 'EUR' }, eventCode: 'AUTHORISATION', success: 'true', additionalData: {} };
    const { events } = adyen.parseWebhook({ body: { notificationItems: [sign({ ...base, merchantAccountCode: 'VanguardShop' }), sign({ ...base, pspReference: 'P2', merchantAccountCode: 'SomeOtherShop' })] } });
    assert.equal(events.length, 1);
    assert.deepEqual(events[0].amount, { value: 11089, currency: 'EUR' });
    assert.equal(events[0].status, 'paid');
  } finally {
    Object.assign(config.payments.adyen, saved);
  }
});
