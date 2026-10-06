import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { one } from '../db/index.js';
import { parse, badRequest } from '../lib/http.js';
import { unsubscribeToken } from '../lib/newsletter.js';
import { safeEqual } from '../lib/secure.js';

const router = Router();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false });

const emailField = z.string().trim().toLowerCase().email().max(200);

router.post('/', limiter, async (req, res) => {
  const { email, locale } = parse(z.object({ email: emailField, locale: z.enum(['en', 'fr', 'de']).default('en') }), req.body);
  // An address that unsubscribed stays unsubscribed: otherwise anyone could re-enrol someone else's address (and override
  // their opt-out) just by typing it in the form. The answer is identical in every case, so it never reveals who is subscribed.
  await one(
    `INSERT INTO newsletter_subscribers(email, locale) VALUES ($1,$2)
     ON CONFLICT (email) DO NOTHING RETURNING id`,
    [email, locale],
  );
  res.status(201).json({ ok: true });
});

// One-click unsubscribe (the page behind the link in every e-mail calls this with the signed token)
router.post('/unsubscribe', limiter, async (req, res) => {
  const { email, token } = parse(z.object({ email: emailField, token: z.string().min(16).max(64) }), req.body);
  if (!safeEqual(token, unsubscribeToken(email))) throw badRequest('Invalid unsubscribe link');
  await one('UPDATE newsletter_subscribers SET unsubscribed_at = COALESCE(unsubscribed_at, now()) WHERE email = $1 RETURNING 1', [email]);
  res.json({ ok: true });
});

export default router;
