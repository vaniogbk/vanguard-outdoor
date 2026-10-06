import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import config from '../config.js';
import { one, tx } from '../db/index.js';
import { parse, badRequest, notFound, forbidden, HttpError } from '../lib/http.js';
import { optionalAuth } from '../lib/auth.js';
import { quote } from '../lib/pricing.js';
import { COUNTRIES, ZONES, SHIPPING_RATES } from '../lib/europe.js';
import { addEvent, applyPaymentResult, loadOrder, serializeOrder } from '../lib/orders.js';
import { enabledProviders, getProvider } from '../payments/index.js';
import { addressSchema } from './auth.js';

const router = Router();
const limiter = rateLimit({ windowMs: 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false });

const itemsSchema = z.array(z.object({ variantId: z.string().uuid(), quantity: z.number().int().min(1).max(20) })).min(1).max(50);

router.get('/config', (_req, res) => {
  res.json({
    currency: config.currency,
    countries: COUNTRIES,
    zones: ZONES,
    shippingRates: SHIPPING_RATES,
    providers: enabledProviders().map((p) => ({ name: p.name, label: p.label })),
  });
});

router.post('/quote', async (req, res) => {
  const data = parse(
    z.object({
      items: itemsSchema,
      country: z.enum(COUNTRIES).optional(),
      shippingMethod: z.enum(['standard', 'express']).optional(),
      locale: z.enum(['en', 'fr', 'de']).optional().default('en'),
    }),
    req.body,
  );
  res.json(await quote(data));
});

const checkoutSchema = z.object({
  items: itemsSchema,
  email: z.string().trim().toLowerCase().email(),
  shippingAddress: addressSchema,
  shippingMethod: z.enum(['standard', 'express']).default('standard'),
  locale: z.enum(['en', 'fr', 'de']).default('en'),
  provider: z.string().optional(),
  acceptTerms: z.literal(true),
  saveAddress: z.boolean().optional().default(false),
});

router.post('/', limiter, optionalAuth, async (req, res) => {
  const data = parse(checkoutSchema, req.body);
  const provider = getProvider(data.provider);
  if (!provider) throw new HttpError(503, 'No payment provider is configured');

  const q = await quote({ items: data.items, country: data.shippingAddress.country, shippingMethod: data.shippingMethod, locale: data.locale });
  if (q.problems.length) throw new HttpError(409, 'Some items are no longer available', q.problems);

  const { order, items } = await tx(async (c) => {
    const { rows: [order] } = await c.query(
      `INSERT INTO orders(user_id, email, locale, subtotal_cents, shipping_cents, vat_cents, vat_rate, total_cents,
         shipping_address, shipping_method, payment_provider)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [req.user?.id || null, data.email, data.locale, q.subtotalCents, q.shippingCents, q.vatCents, q.vatRate,
        q.totalCents, data.shippingAddress, q.shippingMethod, provider.name],
    );
    const items = [];
    for (const l of q.lines) {
      const { rows: [item] } = await c.query(
        `INSERT INTO order_items(order_id, product_id, variant_id, title, variant_title, sku, image, unit_price_cents, quantity, line_total_cents)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [order.id, l.productId, l.variantId, l.title, l.variantTitle, l.sku, l.image, l.unitPriceCents, l.quantity, l.lineTotalCents],
      );
      items.push(item);
    }
    await addEvent(c, order.id, 'created', 'Order placed');
    if (data.saveAddress && req.user) {
      await c.query('UPDATE users SET default_address = $2 WHERE id = $1', [req.user.id, data.shippingAddress]);
    }
    return { order, items };
  });

  const ret = `${config.frontendUrl}/${order.locale}/checkout/return?order=${order.number}&token=${order.access_token}`;
  let payment;
  try {
    payment = await provider.createPayment({ order, items, returnUrl: ret, cancelUrl: `${ret}&cancelled=1` });
  } catch (err) {
    console.error(`[checkout] ${provider.name} createPayment failed`, err.message);
    await one(`UPDATE orders SET status='payment_failed', updated_at=now() WHERE id=$1 RETURNING 1`, [order.id]);
    throw new HttpError(502, 'Payment provider unavailable, please try again');
  }
  await one('UPDATE orders SET payment_session_id = $2 WHERE id = $1 RETURNING 1', [order.id, payment.sessionId]);

  res.status(201).json({
    order: { id: order.id, number: order.number, accessToken: order.access_token, totalCents: order.total_cents },
    payment: payment.client,
  });
});

/** Order status for the return page (guest-safe through the access token) */
router.get('/status/:number', async (req, res) => {
  const data = await loadOrder('number = $1', [req.params.number]);
  if (!data) throw notFound('Order not found');
  if (req.query.token !== data.order.access_token) throw forbidden();

  // Adyen redirect methods: verify the result if the webhook hasn't landed yet
  if (data.order.status === 'pending_payment' && data.order.payment_provider === 'adyen' && (req.query.sessionResult || req.query.redirectResult)) {
    const provider = getProvider('adyen');
    try {
      const status = await provider?.verifyReturn({
        order: data.order, // the PSP result must belong to THIS order (reference + amount), not to another payment of the shopper
        sessionId: data.order.payment_session_id,
        sessionResult: req.query.sessionResult ? String(req.query.sessionResult) : undefined,
        redirectResult: req.query.redirectResult ? String(req.query.redirectResult) : undefined,
      });
      if (status) {
        await applyPaymentResult({ orderNumber: data.order.number, status, provider: 'adyen', reference: null });
        return res.json({ order: serializeOrder(await loadOrder('id = $1', [data.order.id])) });
      }
    } catch (e) {
      console.warn('[checkout] adyen verifyReturn failed', e.message);
    }
  }
  if (req.query.cancelled === '1' && data.order.status === 'pending_payment') {
    await applyPaymentResult({ orderNumber: data.order.number, status: 'cancelled', provider: data.order.payment_provider });
    return res.json({ order: serializeOrder(await loadOrder('id = $1', [data.order.id])) });
  }
  res.json({ order: serializeOrder(data) });
});

/** Development-only: simulate the PSP result */
router.post('/mock/:number/pay', async (req, res) => {
  if (config.isProd || !getProvider('mock')) throw notFound();
  const { token, outcome } = parse(z.object({ token: z.string(), outcome: z.enum(['success', 'failure']).default('success') }), req.body);
  const order = await one('SELECT * FROM orders WHERE number = $1', [req.params.number]);
  if (!order || order.access_token !== token) throw notFound('Order not found');
  if (order.payment_provider !== 'mock') throw badRequest('Not a mock order');
  await applyPaymentResult({
    orderNumber: order.number,
    status: outcome === 'success' ? 'paid' : 'failed',
    reference: `MOCK-${Date.now()}`,
    provider: 'mock',
  });
  res.json({ order: serializeOrder(await loadOrder('id = $1', [order.id])) });
});

export default router;
