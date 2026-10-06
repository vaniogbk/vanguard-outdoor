import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { many } from '../db/index.js';
import { parse, notFound } from '../lib/http.js';
import { requireAuth } from '../lib/auth.js';
import { loadOrder, serializeOrder } from '../lib/orders.js';

const router = Router();

// Customer order history
router.get('/', requireAuth, async (req, res) => {
  const orders = await many(
    `SELECT o.*, (SELECT COUNT(*)::int FROM order_items WHERE order_id = o.id) AS item_count,
            (SELECT image FROM order_items WHERE order_id = o.id ORDER BY id LIMIT 1) AS first_image
     FROM orders o WHERE o.user_id = $1 ORDER BY o.created_at DESC`,
    [req.user.id],
  );
  res.json({
    orders: orders.map((o) => ({
      ...serializeOrder({ order: o }),
      items: undefined,
      events: undefined,
      itemCount: o.item_count,
      image: o.first_image,
    })),
  });
});

router.get('/:number', requireAuth, async (req, res) => {
  const data = await loadOrder('number = $1 AND user_id = $2', [req.params.number, req.user.id]);
  if (!data) throw notFound('Order not found');
  res.json({ order: serializeOrder(data) });
});

// Guest tracking: order number + email
const lookupLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false });
router.post('/lookup', lookupLimiter, async (req, res) => {
  const { number, email } = parse(
    z.object({ number: z.string().trim().toUpperCase(), email: z.string().trim().toLowerCase().email() }),
    req.body,
  );
  const data = await loadOrder('number = $1 AND email = $2', [number, email]);
  if (!data) throw notFound('No order matches this number and email');
  res.json({ order: serializeOrder(data) });
});

export default router;
