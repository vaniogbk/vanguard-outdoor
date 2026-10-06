import { one, many, tx } from '../db/index.js';

export const ORDER_STATUSES = [
  'pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'payment_failed',
];

export async function addEvent(client, orderId, type, message, data = {}, visible = true) {
  await client.query(
    'INSERT INTO order_events(order_id, type, message, data, visible_to_customer) VALUES ($1,$2,$3,$4,$5)',
    [orderId, type, message, data, visible],
  );
}

/**
 * Apply a payment result coming from a PSP (webhook or verified return).
 * Idempotent: a paid order is never re-processed, stock is decremented once.
 */
export async function applyPaymentResult({ orderNumber, status, reference, provider, raw, amount }) {
  return tx(async (c) => {
    const { rows } = await c.query('SELECT * FROM orders WHERE number = $1 FOR UPDATE', [orderNumber]);
    const order = rows[0];
    if (!order) return { ok: false, reason: 'order_not_found' };
    // a provider can only settle the orders that were created for it (a Payoneer notification must never pay an Adyen order)
    if (provider && order.payment_provider !== provider) return { ok: false, reason: 'provider_mismatch' };

    if (status === 'paid') {
      if (order.status !== 'pending_payment' && order.status !== 'payment_failed') return { ok: true, order, unchanged: true };
      // the PSP reports what was actually authorised: never mark an order paid for a different amount / currency
      if (amount && (Number(amount.value) !== order.total_cents || amount.currency !== order.currency)) {
        await addEvent(c, order.id, 'payment_amount_mismatch', 'Authorised amount differs from the order total — needs review',
          { provider, reference, expected: { value: order.total_cents, currency: order.currency }, received: amount }, false);
        return { ok: false, reason: 'amount_mismatch' };
      }
      await c.query(
        `UPDATE orders SET status='paid', paid_at=now(), updated_at=now(), payment_reference=COALESCE($2, payment_reference)
         WHERE id=$1`, [order.id, reference || null],
      );
      // decrement stock once, at payment time
      await c.query(
        `UPDATE product_variants v SET stock = v.stock - oi.quantity
         FROM order_items oi WHERE oi.order_id = $1 AND oi.variant_id = v.id`, [order.id],
      );
      await addEvent(c, order.id, 'payment_confirmed', 'Payment confirmed', { provider, reference });
    } else if (status === 'failed') {
      if (order.status !== 'pending_payment') return { ok: true, order, unchanged: true };
      await c.query(`UPDATE orders SET status='payment_failed', updated_at=now() WHERE id=$1`, [order.id]);
      await addEvent(c, order.id, 'payment_failed', 'Payment failed or was refused', { provider, reference });
    } else if (status === 'refunded') {
      if (order.status === 'refunded') return { ok: true, order, unchanged: true };
      await c.query(`UPDATE orders SET status='refunded', updated_at=now() WHERE id=$1`, [order.id]);
      await addEvent(c, order.id, 'refunded', 'Order refunded', { provider, reference });
    } else if (status === 'cancelled') {
      if (order.status !== 'pending_payment') return { ok: true, order, unchanged: true };
      await c.query(`UPDATE orders SET status='cancelled', updated_at=now() WHERE id=$1`, [order.id]);
      await addEvent(c, order.id, 'cancelled', 'Payment cancelled', { provider, reference });
    }
    if (raw) await addEvent(c, order.id, 'psp_event', `${provider} event`, raw, false);
    const updated = (await c.query('SELECT * FROM orders WHERE id=$1', [order.id])).rows[0];
    return { ok: true, order: updated };
  });
}

/** Record a webhook event once; returns false if already processed */
export async function recordPaymentEvent(provider, eventKey, payload) {
  const row = await one(
    `INSERT INTO payment_events(provider, event_key, payload) VALUES ($1,$2,$3)
     ON CONFLICT (provider, event_key) DO NOTHING RETURNING id`,
    [provider, eventKey, payload],
  );
  return Boolean(row);
}

export async function loadOrder(where, params, { includeHidden = false } = {}) {
  const order = await one(`SELECT * FROM orders WHERE ${where}`, params);
  if (!order) return null;
  const [items, events] = await Promise.all([
    many('SELECT * FROM order_items WHERE order_id = $1 ORDER BY id', [order.id]),
    many(
      `SELECT type, message, data, created_at FROM order_events WHERE order_id = $1
       ${includeHidden ? '' : 'AND visible_to_customer'} ORDER BY created_at, id`,
      [order.id],
    ),
  ]);
  return { order, items, events };
}

export function serializeOrder({ order, items = [], events = [] }, { admin = false } = {}) {
  return {
    id: order.id,
    number: order.number,
    status: order.status,
    email: order.email,
    locale: order.locale,
    currency: order.currency,
    subtotalCents: order.subtotal_cents,
    shippingCents: order.shipping_cents,
    discountCents: order.discount_cents,
    vatCents: order.vat_cents,
    vatRate: Number(order.vat_rate),
    totalCents: order.total_cents,
    shippingAddress: order.shipping_address,
    shippingMethod: order.shipping_method,
    carrier: order.carrier,
    trackingNumber: order.tracking_number,
    trackingUrl: order.tracking_url,
    paymentProvider: order.payment_provider,
    createdAt: order.created_at,
    paidAt: order.paid_at,
    shippedAt: order.shipped_at,
    deliveredAt: order.delivered_at,
    items: items.map((i) => ({
      id: i.id,
      productId: i.product_id,
      variantId: i.variant_id,
      title: i.title,
      variantTitle: i.variant_title,
      sku: i.sku,
      image: i.image,
      unitPriceCents: i.unit_price_cents,
      quantity: i.quantity,
      lineTotalCents: i.line_total_cents,
    })),
    events: events.map((e) => ({ type: e.type, message: e.message, data: admin ? e.data : undefined, createdAt: e.created_at })),
    ...(admin ? { userId: order.user_id, paymentReference: order.payment_reference, notes: order.notes } : {}),
  };
}
