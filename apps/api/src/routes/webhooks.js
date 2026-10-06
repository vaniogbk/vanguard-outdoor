import { Router } from 'express';
import config from '../config.js';
import { one } from '../db/index.js';
import { notFound } from '../lib/http.js';
import { applyPaymentResult, recordPaymentEvent } from '../lib/orders.js';
import { registry } from '../payments/index.js';

const router = Router();

async function processEvents(providerName, events) {
  for (const ev of events) {
    const fresh = await recordPaymentEvent(providerName, ev.eventKey, ev);
    if (!fresh || !ev.status || !ev.orderNumber) continue;
    let result;
    try {
      result = await applyPaymentResult({
        orderNumber: ev.orderNumber, status: ev.status, reference: ev.reference, provider: providerName, raw: ev.raw, amount: ev.amount,
      });
    } catch (e) {
      // forget the event so the PSP retry is processed again
      await one('DELETE FROM payment_events WHERE provider = $1 AND event_key = $2 RETURNING 1', [providerName, ev.eventKey]);
      throw e;
    }
    if (!result.ok) console.warn(`[webhook:${providerName}] ${result.reason} for ${ev.orderNumber}`);
  }
}

// Adyen standard webhooks (JSON). Configure in Customer Area → Developers → Webhooks, with HMAC key.
router.post('/adyen', async (req, res) => {
  const { events, response } = registry.adyen.parseWebhook(req); // throws 401 on bad HMAC
  await processEvents('adyen', events); // on error → 500 → Adyen retries
  res.type('text/plain').send(response);
});

// Payoneer Checkout notifications (GET query string or form POST).
// The endpoint only exists while Payoneer is really enabled: otherwise it answers 404 like any unknown route.
const payoneerEnabled = () => config.payments.providers.includes('payoneer') && registry.payoneer.isConfigured();

async function payoneerHandler(req, res) {
  if (!payoneerEnabled()) throw notFound('Route not found');
  const params = { ...req.query, ...(req.body && typeof req.body === 'object' ? req.body : {}) };
  const transactionId = typeof params.transactionId === 'string' ? params.transactionId : null;
  const order = transactionId ? await one('SELECT * FROM orders WHERE number = $1', [transactionId]) : null;
  const { events, response } = registry.payoneer.parseWebhook(req, { order });
  await processEvents('payoneer', events);
  res.type('text/plain').send(response);
}
router.get('/payoneer', payoneerHandler);
router.post('/payoneer', payoneerHandler);

export default router;
