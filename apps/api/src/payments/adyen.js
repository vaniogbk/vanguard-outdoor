/**
 * Adyen — primary European PSP: cards (Visa, Mastercard, CB, Amex), SEPA Direct Debit,
 * iDEAL, Bancontact, Klarna, Apple Pay / Google Pay… enabled per country from the
 * Adyen Customer Area. Integration: Sessions flow (POST /v71/sessions) + Drop-in on the frontend.
 * Authoritative payment status comes from HMAC-signed webhooks (AUTHORISATION, REFUND, CANCELLATION).
 *
 * Klarna (like the other "open invoice" methods: Riverty, Ratepay, Afterpay…) needs a complete basket:
 *   - `lineItems` whose total equals the payment amount → shipping is sent as its own line,
 *   - the tax split of every line (taxAmount + taxPercentage in basis points),
 *   - billing + delivery address, shopper name and e-mail.
 * It is switched on per merchant account in the Customer Area (Settings › Payment methods): no code switch is needed,
 * the Drop-in only offers it to shoppers whose country / currency / basket are eligible.
 */
import adyen from '@adyen/api-library';
import config from '../config.js';

const { Client, CheckoutAPI, hmacValidator, EnvironmentEnum } = adyen;
const cfg = config.payments.adyen;

let checkout;
function api() {
  if (!checkout) {
    const live = cfg.environment === 'live';
    const client = new Client({
      apiKey: cfg.apiKey,
      environment: live ? EnvironmentEnum.LIVE : EnvironmentEnum.TEST,
      ...(live ? { liveEndpointUrlPrefix: cfg.liveEndpointUrlPrefix } : {}),
    });
    checkout = new CheckoutAPI(client);
  }
  return checkout;
}

/** Test seam: inject a fake CheckoutAPI (never used in production code paths) */
export const _testing = { setApi(fake) { checkout = fake; } };

const SHOPPER_LOCALES = { en: 'en-GB', fr: 'fr-FR', de: 'de-DE' };
const SHIPPING_LABEL = { en: 'Shipping', fr: 'Livraison', de: 'Versand' };
const DESCRIPTION_MAX = 200;
const clip = (s, n = DESCRIPTION_MAX) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** Split a VAT-inclusive amount (minor units) the way Klarna prints it on the invoice */
export function taxSplit(grossCents, ratePercent) {
  const rate = Number(ratePercent) || 0;
  const taxAmount = rate ? Math.round(grossCents - grossCents / (1 + rate / 100)) : 0;
  return {
    amountIncludingTax: grossCents,
    amountExcludingTax: grossCents - taxAmount,
    taxAmount,
    taxPercentage: Math.round(rate * 100), // basis points: 20 % → 2000
  };
}

/** Basket sent to Adyen: products + shipping, so that Σ(quantity × amountIncludingTax) = order total */
export function buildLineItems(order, items) {
  const rate = order.vat_rate;
  const lines = items.map((i) => ({
    id: i.sku || i.id,
    description: clip(i.variant_title ? `${i.title} — ${i.variant_title}` : i.title),
    quantity: i.quantity,
    ...taxSplit(i.unit_price_cents, rate),
    ...(i.image && /^https:\/\//.test(i.image) ? { imageUrl: i.image } : {}),
  }));
  if (order.shipping_cents > 0) {
    lines.push({
      id: 'shipping',
      description: `${SHIPPING_LABEL[order.locale] || SHIPPING_LABEL.en} (${order.shipping_method})`,
      quantity: 1,
      ...taxSplit(order.shipping_cents, rate),
    });
  }
  return lines;
}

/**
 * Open-invoice methods want the house number apart from the street.
 *   "Hauptstraße 12" → Hauptstraße + 12     "12 rue de Rivoli" → rue de Rivoli + 12
 * When the line cannot be split with confidence the previous behaviour is kept (whole line as street).
 */
export function adyenAddress(addr) {
  const line1 = String(addr.line1 || '').trim();
  const line2 = String(addr.line2 || '').trim();
  let street = line1;
  let number = '';
  const trailing = line1.match(/^(.*\D)[\s,]+(\d+[A-Za-z]?(?:[-/]\d+[A-Za-z]?)?)$/); // "Hauptstraße 12", "Calle Mayor, 5"
  const leading = line1.match(/^(\d+[A-Za-z]?(?:[-/]\d+[A-Za-z]?)?)[\s,]+(\D.*)$/); // "12 rue de Rivoli"
  if (trailing) { street = trailing[1].replace(/[\s,]+$/, ''); number = trailing[2]; }
  else if (leading) { street = leading[2].trim(); number = leading[1]; }
  return {
    street,
    houseNumberOrName: [number, line2].filter(Boolean).join(' ') || '-',
    postalCode: addr.postalCode,
    city: addr.city,
    country: addr.country,
  };
}

/** Body of POST /sessions for an order */
export function buildSessionRequest(order, items, returnUrl) {
  const addr = order.shipping_address;
  const address = adyenAddress(addr);
  return {
    merchantAccount: cfg.merchantAccount,
    reference: order.number,
    amount: { value: order.total_cents, currency: order.currency },
    countryCode: addr.country,
    shopperLocale: SHOPPER_LOCALES[order.locale] || 'en-GB',
    shopperEmail: order.email,
    ...(order.user_id ? { shopperReference: order.user_id } : {}),
    shopperName: { firstName: addr.firstName, lastName: addr.lastName },
    telephoneNumber: addr.phone || undefined,
    returnUrl,
    channel: 'Web',
    deliveryAddress: address,
    billingAddress: address, // one-address checkout: the invoice goes to the delivery address (required by Klarna)
    lineItems: buildLineItems(order, items),
    // Session expires after 1h; abandoned orders stay "pending_payment"
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  };
}

/**
 * A payment result only counts for the order it was made for. Adyen echoes the reference (and amount) of the payment:
 * without this check a shopper could replay the result of a cheap payment against a more expensive pending order.
 */
function belongsToOrder(result, order, { needAmount = false } = {}) {
  if (!order || result.merchantReference !== order.number) return false;
  if (result.amount) return result.amount.value === order.total_cents && result.amount.currency === order.currency;
  return !needAmount;
}

export default {
  name: 'adyen',
  label: 'Card, SEPA, iDEAL, Bancontact, Klarna…',

  isConfigured() {
    return Boolean(cfg.apiKey && cfg.merchantAccount && cfg.clientKey);
  },

  async createPayment({ order, items, returnUrl }) {
    const body = buildSessionRequest(order, items, returnUrl);
    const basketTotal = body.lineItems.reduce((s, l) => s + l.quantity * l.amountIncludingTax, 0);
    if (basketTotal !== order.total_cents) {
      // Klarna refuses a basket that does not add up to the amount; other methods do not care
      console.warn(`[adyen] ${order.number}: line items total ${basketTotal} ≠ amount ${order.total_cents}`);
    }
    const session = await api().PaymentsApi.sessions(body, { idempotencyKey: `session-${order.id}-${order.total_cents}` });
    return {
      sessionId: session.id,
      client: {
        type: 'adyen',
        sessionId: session.id,
        sessionData: session.sessionData,
        clientKey: cfg.clientKey,
        environment: cfg.environment === 'live' ? 'live' : 'test',
        amount: { value: order.total_cents, currency: order.currency },
        countryCode: order.shipping_address.country,
        locale: SHOPPER_LOCALES[order.locale] || 'en-GB',
      },
    };
  },

  /**
   * Fallback when the shopper returns before the webhook arrives.
   * - sessionResult: from Drop-in onPaymentCompleted
   * - redirectResult: appended to returnUrl after redirect methods (Klarna, iDEAL, 3DS2 redirect…)
   * Returns 'paid' | 'failed' | 'cancelled' | null (null = unknown / not this order's payment → wait for the webhook).
   */
  async verifyReturn({ order, sessionId, sessionResult, redirectResult }) {
    if (redirectResult) {
      const r = await api().PaymentsApi.paymentsDetails({ details: { redirectResult } });
      if (!belongsToOrder(r, order, { needAmount: r.resultCode === 'Authorised' })) {
        console.warn(`[adyen] redirectResult for ${r.merchantReference} ignored on order ${order?.number}`);
        return null;
      }
      if (r.resultCode === 'Authorised') return 'paid';
      if (r.resultCode === 'Refused' || r.resultCode === 'Error') return 'failed';
      if (r.resultCode === 'Cancelled') return 'cancelled';
      return null; // Pending / Received → wait for webhook
    }
    if (!sessionId || !sessionResult) return null;
    const r = await api().PaymentsApi.getResultOfPaymentSession(sessionId, sessionResult);
    if (r.reference !== order?.number) return null;
    if (r.status === 'completed') return 'paid';
    if (r.status === 'refused') return 'failed';
    if (r.status === 'canceled' || r.status === 'expired') return 'cancelled';
    return null;
  },

  /** Parse + authenticate a standard webhook; returns normalized events */
  parseWebhook(req) {
    const items = req.body?.notificationItems || [];
    const validator = new hmacValidator();
    const events = [];
    for (const wrapper of items) {
      const item = wrapper.NotificationRequestItem;
      if (!item) continue;
      if (!cfg.hmacKey || !validator.validateHMAC(item, cfg.hmacKey)) {
        const err = new Error('Invalid HMAC signature');
        err.status = 401;
        throw err;
      }
      // company-level webhooks can carry other merchant accounts: acknowledge them, never act on them
      if (cfg.merchantAccount && item.merchantAccountCode !== cfg.merchantAccount) continue;
      const success = item.success === 'true' || item.success === true;
      let status = null;
      switch (item.eventCode) {
        case 'AUTHORISATION': status = success ? 'paid' : 'failed'; break;
        case 'REFUND': status = success ? 'refunded' : null; break;
        case 'CANCELLATION':
        case 'CANCEL_OR_REFUND': status = success ? 'cancelled' : null; break;
        default: status = null;
      }
      events.push({
        eventKey: `${item.pspReference}:${item.eventCode}:${item.success}`,
        orderNumber: item.merchantReference,
        status,
        reference: item.pspReference,
        amount: item.amount ? { value: Number(item.amount.value), currency: item.amount.currency } : null,
        raw: { eventCode: item.eventCode, success: item.success, reason: item.reason, paymentMethod: item.paymentMethod },
      });
    }
    return { events, response: '[accepted]' };
  },
};
