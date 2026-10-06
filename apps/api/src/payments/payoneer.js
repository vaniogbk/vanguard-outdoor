/**
 * Payoneer Checkout (OPG / "optile" platform) — hosted payment page (cards).
 *
 * Flow: POST {baseUrl}/api/lists with integration=HOSTED → redirect shopper to links.redirect.
 * Payoneer calls callback.notificationUrl on every status change. We authenticate notifications
 * with a shared secret in the URL (PAYONEER_NOTIFICATION_SECRET, its own random value) AND by matching the stored
 * LIST longId + transactionId. Without that secret the provider is simply not available.
 *
 * ⚠️ Payoneer Checkout onboarding is merchant-specific (eligible entities, enabled methods).
 * Confirm field names / status codes against the docs provided with your merchant account
 * (checkoutdocs.payoneer.com) before going live.
 */
import config from '../config.js';
import { safeEqual } from '../lib/secure.js';

const cfg = config.payments.payoneer;
const MEDIA = 'application/vnd.optile.payment.enterprise-v1-extensible+json';
const LANG = { en: 'en_GB', fr: 'fr_FR', de: 'de_DE' };

const PAID = ['charged', 'paid_out'];
const FAILED = ['declined', 'failed', 'rejected', 'aborted'];
const CANCELLED = ['canceled', 'cancelled', 'expired'];
const REFUNDED = ['refunded', 'refund_credited', 'charged_back'];

const reject = (status, message) => Object.assign(new Error(message), { status });

export default {
  name: 'payoneer',
  label: 'Payoneer Checkout (Visa / Mastercard)',

  isConfigured() {
    return Boolean(cfg.merchantCode && cfg.apiToken && cfg.notificationSecret);
  },

  async createPayment({ order, items, returnUrl, cancelUrl }) {
    const addr = order.shipping_address;
    const body = {
      transactionId: order.number,
      integration: 'HOSTED',
      country: addr.country,
      ...(cfg.division ? { division: cfg.division } : {}),
      customer: {
        number: order.user_id || `guest-${order.id}`,
        email: order.email,
        name: { firstName: addr.firstName, lastName: addr.lastName },
        addresses: {
          shipping: { street: addr.line1, zip: addr.postalCode, city: addr.city, country: addr.country },
        },
      },
      payment: {
        amount: order.total_cents / 100,
        currency: order.currency,
        reference: `Vanguard Outdoor ${order.number}`,
      },
      products: items.map((i) => ({
        code: i.sku,
        name: i.title,
        quantity: i.quantity,
        amount: i.line_total_cents / 100,
        currency: order.currency,
      })),
      style: { language: LANG[order.locale] || 'en_GB' },
      callback: {
        returnUrl,
        cancelUrl,
        notificationUrl: `${config.publicApiUrl}/api/webhooks/payoneer?s=${encodeURIComponent(cfg.notificationSecret)}`,
      },
    };
    const res = await fetch(`${cfg.baseUrl}/api/lists`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${cfg.merchantCode}:${cfg.apiToken}`).toString('base64')}`,
        'Content-Type': MEDIA,
        Accept: MEDIA,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.links?.redirect) {
      const err = new Error(`Payoneer LIST failed (${res.status}): ${data?.resultInfo || 'no redirect link'}`);
      err.status = 502;
      throw err;
    }
    return {
      sessionId: data.identification?.longId,
      client: { type: 'redirect', url: data.links.redirect },
    };
  },

  /** Notifications come as GET query params or form POST */
  parseWebhook(req, { order } = {}) {
    const p = { ...req.query, ...(req.body && typeof req.body === 'object' ? req.body : {}) };
    if (!cfg.notificationSecret || !safeEqual(p.s, cfg.notificationSecret)) throw reject(401, 'Invalid notification secret');
    // unknown transaction: acknowledge so Payoneer stops retrying, but there is nothing to settle
    if (!order) return { events: [], response: 'OK' };
    // the notification must carry the LIST id that this order was created with
    if (!p.longId || !order.payment_session_id || order.payment_session_id !== p.longId) throw reject(400, 'longId mismatch');
    const code = String(p.statusCode || '').toLowerCase();
    let status = null;
    if (PAID.includes(code)) status = 'paid';
    else if (FAILED.includes(code)) status = 'failed';
    else if (CANCELLED.includes(code)) status = 'cancelled';
    else if (REFUNDED.includes(code)) status = 'refunded';
    return {
      events: [{
        eventKey: p.notificationId || `${p.longId}:${code}:${p.reasonCode || ''}`,
        orderNumber: order.number,
        status,
        reference: p.longId,
        raw: { statusCode: p.statusCode, reasonCode: p.reasonCode, interactionCode: p.interactionCode },
      }],
      response: 'OK',
    };
  },
};
