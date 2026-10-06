import { Router } from 'express';
import { z } from 'zod';
import { one, many, tx } from '../db/index.js';
import { parse, notFound, badRequest, pick, HttpError } from '../lib/http.js';
import { requireAdmin } from '../lib/auth.js';
import { listProducts, getProduct, serializeProduct } from '../lib/catalog.js';
import { ORDER_STATUSES, addEvent, loadOrder, serializeOrder } from '../lib/orders.js';
import { CARRIERS, trackingUrl } from '../lib/europe.js';
import { runImport } from '../scripts/import-shopify.js';

const router = Router();
router.use(requireAdmin);

const i18n = z.object({ en: z.string().max(10000), fr: z.string().max(10000).optional().default(''), de: z.string().max(10000).optional().default('') });
const i18nList = z.object({ en: z.array(z.string()).default([]), fr: z.array(z.string()).default([]), de: z.array(z.string()).default([]) });

const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// ───────────── Dashboard ─────────────
router.get('/stats', async (_req, res) => {
  const paid = `status IN ('paid','processing','shipped','delivered')`;
  const [totals, last30, byStatus, top, daily, lowStock] = await Promise.all([
    one(`SELECT COUNT(*)::int AS orders, COALESCE(SUM(total_cents),0)::bigint AS revenue,
           COALESCE(AVG(total_cents),0)::int AS aov FROM orders WHERE ${paid}`),
    one(`SELECT COUNT(*)::int AS orders, COALESCE(SUM(total_cents),0)::bigint AS revenue
         FROM orders WHERE ${paid} AND created_at > now() - interval '30 days'`),
    many(`SELECT status, COUNT(*)::int AS n FROM orders GROUP BY status`),
    many(`SELECT COALESCE(p.title->>'fr', p.title->>'en', MIN(oi.title)) AS title,
            SUM(oi.quantity)::int AS qty, SUM(oi.line_total_cents)::bigint AS revenue
          FROM order_items oi JOIN orders o ON o.id = oi.order_id LEFT JOIN products p ON p.id = oi.product_id
          WHERE o.${paid}
          GROUP BY COALESCE(oi.product_id::text, oi.title), p.title ORDER BY qty DESC LIMIT 5`),
    many(`SELECT to_char(d, 'YYYY-MM-DD') AS day, COALESCE(SUM(o.total_cents),0)::bigint AS revenue, COUNT(o.id)::int AS orders
          FROM generate_series(current_date - 13, current_date, interval '1 day') d
          LEFT JOIN orders o ON o.created_at::date = d::date AND o.${paid}
          GROUP BY d ORDER BY d`),
    many(`SELECT v.id, v.sku, v.stock, p.title, p.id AS product_id FROM product_variants v JOIN products p ON p.id = v.product_id
          WHERE p.status = 'active' AND v.stock <= 5 ORDER BY v.stock LIMIT 10`),
  ]);
  const customers = await one(`SELECT COUNT(*)::int AS n FROM users WHERE role = 'customer'`);
  const products = await one(`SELECT COUNT(*)::int AS n FROM products WHERE status = 'active'`);
  res.json({
    totals: { ...totals, customers: customers.n, products: products.n },
    last30,
    byStatus,
    topProducts: top,
    daily,
    lowStock: lowStock.map((r) => ({ ...r, title: pick(r.title, 'fr') })),
  });
});

// ───────────── Products ─────────────
router.get('/products', async (req, res) => {
  const result = await listProducts({ ...req.query, sort: req.query.sort || 'newest', limit: req.query.limit || 50 }, { includeInactive: true });
  res.json({
    products: result.rows.map((r) => ({ ...serializeProduct(r, 'en'), status: r.status, totalStock: r.total_stock, variantCount: r.variants.length })),
    pagination: { total: result.total, page: result.page, limit: result.limit, pages: result.pages },
  });
});

router.get('/products/:id', async (req, res) => {
  const row = await getProduct({ id: req.params.id }, { includeInactive: true });
  if (!row) throw notFound('Product not found');
  res.json({ product: serializeProduct(row, 'en', { full: true, admin: true }) });
});

const variantSchema = z.object({
  id: z.string().uuid().optional(),
  sku: z.string().trim().min(1).max(80),
  title: z.string().trim().max(120).default('Default'),
  options: z.record(z.string(), z.string()).default({}),
  priceCents: z.number().int().min(0),
  compareAtCents: z.number().int().min(0).nullable().optional(),
  stock: z.number().int().min(0).max(1000000),
  weightGrams: z.number().int().min(0).default(1000),
});

const productSchema = z.object({
  slug: z.string().trim().max(160).optional(),
  brand: z.enum(['reactive-outdoor', 'kilos-gear', 'vanguard']),
  categoryId: z.number().int().nullable().optional(),
  title: i18n,
  description: i18n.optional().default({ en: '', fr: '', de: '' }),
  highlights: i18nList.optional().default({ en: [], fr: [], de: [] }),
  images: z.array(z.string().url()).max(20).default([]),
  tags: z.array(z.string().max(60)).max(30).default([]),
  status: z.enum(['active', 'draft', 'archived']).default('active'),
  featured: z.boolean().default(false),
  sourceUrl: z.string().url().nullable().optional(),
  variants: z.array(variantSchema).min(1).max(100),
});

async function saveProduct(c, id, data) {
  const slug = slugify(data.slug || data.title.en);
  if (!slug) throw badRequest('Invalid slug');
  const params = [slug, data.brand, data.categoryId ?? null, data.title, data.description, data.highlights,
    JSON.stringify(data.images), data.tags, data.status, data.featured, data.sourceUrl ?? null];
  let product;
  if (id) {
    ({ rows: [product] } = await c.query(
      `UPDATE products SET slug=$1, brand=$2, category_id=$3, title=$4, description=$5, highlights=$6, images=$7,
         tags=$8, status=$9, featured=$10, source_url=$11, updated_at=now() WHERE id=$12 RETURNING *`,
      [...params, id],
    ));
    if (!product) throw notFound('Product not found');
  } else {
    ({ rows: [product] } = await c.query(
      `INSERT INTO products(slug, brand, category_id, title, description, highlights, images, tags, status, featured, source_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      params,
    ));
  }
  const keep = [];
  for (const [position, v] of data.variants.entries()) {
    const vals = [v.sku, v.title, v.options, v.priceCents, v.compareAtCents ?? null, v.stock, v.weightGrams, position];
    if (v.id) {
      const { rows } = await c.query(
        `UPDATE product_variants SET sku=$1, title_i18n = CASE WHEN title <> $2 THEN '{}'::jsonb ELSE title_i18n END, title=$2, options=$3, price_cents=$4, compare_at_cents=$5, stock=$6,
           weight_grams=$7, position=$8 WHERE id=$9 AND product_id=$10 RETURNING id`,
        [...vals, v.id, product.id],
      );
      if (rows[0]) { keep.push(rows[0].id); continue; }
    }
    const { rows: [row] } = await c.query(
      `INSERT INTO product_variants(sku, title, options, price_cents, compare_at_cents, stock, weight_grams, position, product_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [...vals, product.id],
    );
    keep.push(row.id);
  }
  await c.query('DELETE FROM product_variants WHERE product_id = $1 AND NOT (id = ANY($2::uuid[]))', [product.id, keep]);
  return product.id;
}

function pgConflict(e) {
  if (e.code === '23505') throw badRequest(`Duplicate value: ${e.detail || 'slug or SKU already used'}`);
  throw e;
}

router.post('/products', async (req, res) => {
  const data = parse(productSchema, req.body);
  const id = await tx((c) => saveProduct(c, null, data)).catch(pgConflict);
  const row = await getProduct({ id }, { includeInactive: true });
  res.status(201).json({ product: serializeProduct(row, 'en', { full: true, admin: true }) });
});

router.put('/products/:id', async (req, res) => {
  const data = parse(productSchema, req.body);
  await tx((c) => saveProduct(c, req.params.id, data)).catch(pgConflict);
  const row = await getProduct({ id: req.params.id }, { includeInactive: true });
  res.json({ product: serializeProduct(row, 'en', { full: true, admin: true }) });
});

// Quick inline edits from the product table
router.patch('/products/:id', async (req, res) => {
  const data = parse(z.object({ status: z.enum(['active', 'draft', 'archived']).optional(), featured: z.boolean().optional() }), req.body);
  const row = await one(
    `UPDATE products SET status = COALESCE($2, status), featured = COALESCE($3, featured), updated_at = now() WHERE id = $1 RETURNING id`,
    [req.params.id, data.status ?? null, data.featured ?? null],
  );
  if (!row) throw notFound('Product not found');
  res.json({ ok: true });
});

router.delete('/products/:id', async (req, res) => {
  // Soft delete: keep order history intact
  const row = await one(`UPDATE products SET status = 'archived', updated_at = now() WHERE id = $1 RETURNING id`, [req.params.id]);
  if (!row) throw notFound('Product not found');
  res.json({ ok: true });
});

router.patch('/variants/:id', async (req, res) => {
  const data = parse(z.object({
    stock: z.number().int().min(0).optional(),
    priceCents: z.number().int().min(0).optional(),
    compareAtCents: z.number().int().min(0).nullable().optional(),
  }), req.body);
  const row = await one(
    `UPDATE product_variants SET stock = COALESCE($2, stock), price_cents = COALESCE($3, price_cents),
       compare_at_cents = CASE WHEN $4::boolean THEN $5 ELSE compare_at_cents END
     WHERE id = $1 RETURNING *`,
    [req.params.id, data.stock ?? null, data.priceCents ?? null, data.compareAtCents !== undefined, data.compareAtCents ?? null],
  );
  if (!row) throw notFound('Variant not found');
  res.json({ variant: row });
});

router.get('/categories', async (_req, res) => {
  res.json({ categories: await many('SELECT id, slug, name FROM categories ORDER BY sort_order, id') });
});

// ───────────── Orders ─────────────
router.get('/orders', async (req, res) => {
  const where = [];
  const params = [];
  if (req.query.status) { params.push(String(req.query.status).split(',')); where.push(`o.status = ANY($${params.length})`); }
  if (req.query.q) {
    params.push(`%${req.query.q}%`);
    where.push(`(o.number ILIKE $${params.length} OR o.email ILIKE $${params.length} OR o.shipping_address->>'lastName' ILIKE $${params.length})`);
  }
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const page = Math.max(Number(req.query.page) || 1, 1);
  const w = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows, count] = await Promise.all([
    many(`SELECT o.*, (SELECT COUNT(*)::int FROM order_items WHERE order_id = o.id) AS item_count
          FROM orders o ${w} ORDER BY o.created_at DESC LIMIT ${limit} OFFSET ${(page - 1) * limit}`, params),
    one(`SELECT COUNT(*)::int AS n FROM orders o ${w}`, params),
  ]);
  res.json({
    orders: rows.map((o) => ({ ...serializeOrder({ order: o }, { admin: true }), items: undefined, events: undefined, itemCount: o.item_count })),
    pagination: { total: count.n, page, limit, pages: Math.ceil(count.n / limit) },
  });
});

router.get('/orders/:id', async (req, res) => {
  const data = await loadOrder('id = $1', [req.params.id], { includeHidden: true });
  if (!data) throw notFound('Order not found');
  res.json({ order: serializeOrder(data, { admin: true }), carriers: Object.entries(CARRIERS).map(([id, c]) => ({ id, name: c.name })) });
});

const STATUS_MESSAGES = {
  processing: 'Your order is being prepared',
  shipped: 'Your order has shipped',
  delivered: 'Your order has been delivered',
  cancelled: 'Order cancelled',
  refunded: 'Order refunded',
};

router.patch('/orders/:id', async (req, res) => {
  const data = parse(z.object({
    status: z.enum(ORDER_STATUSES).optional(),
    carrier: z.enum(Object.keys(CARRIERS)).nullable().optional(),
    trackingNumber: z.string().trim().max(80).nullable().optional(),
    note: z.string().trim().max(2000).optional(),
    notifyCustomer: z.boolean().optional().default(true),
  }), req.body);

  await tx(async (c) => {
    const { rows: [order] } = await c.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (!order) throw notFound('Order not found');
    const carrier = data.carrier !== undefined ? data.carrier : order.carrier;
    const trackingNumber = data.trackingNumber !== undefined ? data.trackingNumber : order.tracking_number;
    const status = data.status || (trackingNumber && !order.tracking_number && ['paid', 'processing'].includes(order.status) ? 'shipped' : order.status);
    await c.query(
      `UPDATE orders SET status=$2, carrier=$3, tracking_number=$4, tracking_url=$5,
         shipped_at = CASE WHEN $2 = 'shipped' AND shipped_at IS NULL THEN now() ELSE shipped_at END,
         delivered_at = CASE WHEN $2 = 'delivered' AND delivered_at IS NULL THEN now() ELSE delivered_at END,
         notes = CASE WHEN $6::text IS NOT NULL THEN concat_ws(E'\\n', notes, $6::text) ELSE notes END,
         updated_at = now()
       WHERE id = $1`,
      [order.id, status, carrier, trackingNumber, trackingUrl(carrier, trackingNumber), data.note || null],
    );
    if (status !== order.status) {
      // restock if a paid order is cancelled/refunded
      if (['cancelled', 'refunded'].includes(status) && ['paid', 'processing'].includes(order.status)) {
        await c.query(`UPDATE product_variants v SET stock = v.stock + oi.quantity FROM order_items oi
                       WHERE oi.order_id = $1 AND oi.variant_id = v.id`, [order.id]);
      }
      await addEvent(c, order.id, status, STATUS_MESSAGES[status] || `Status: ${status}`,
        status === 'shipped' ? { carrier, trackingNumber } : {}, data.notifyCustomer);
    } else if (trackingNumber && trackingNumber !== order.tracking_number) {
      await addEvent(c, order.id, 'tracking_updated', 'Tracking information updated', { carrier, trackingNumber });
    }
    if (data.note) await addEvent(c, order.id, 'note', data.note, { by: req.user.email }, false);
  });
  const data2 = await loadOrder('id = $1', [req.params.id], { includeHidden: true });
  res.json({ order: serializeOrder(data2, { admin: true }) });
});

// ───────────── Catalogue sync ─────────────
let importRunning = false;
router.post('/catalog/import', async (req, res) => {
  const opts = parse(z.object({
    brand: z.enum(['reactive-outdoor', 'kilos-gear']).optional(),
    draft: z.boolean().default(true),
    syncStock: z.boolean().default(false),
    archiveMissing: z.boolean().default(false),
    dryRun: z.boolean().default(false),
  }), req.body || {});
  if (importRunning) throw badRequest('An import is already running');
  importRunning = true;
  const lines = [];
  try {
    const summary = await runImport({ ...opts, log: (l) => lines.push(l) });
    res.json({ summary, log: lines.join('\n') });
  } catch (e) {
    console.error('[catalog import]', e);
    throw new HttpError(502, `Catalogue sync failed: ${e.cause?.code || e.message}`);
  } finally {
    importRunning = false;
  }
});

// ───────────── Customers ─────────────
router.get('/customers', async (req, res) => {
  const params = [];
  let w = '';
  if (req.query.q) { params.push(`%${req.query.q}%`); w = `WHERE u.email ILIKE $1 OR u.last_name ILIKE $1`; }
  const rows = await many(
    `SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.locale, u.created_at,
       COUNT(o.id) FILTER (WHERE o.status IN ('paid','processing','shipped','delivered'))::int AS orders,
       COALESCE(SUM(o.total_cents) FILTER (WHERE o.status IN ('paid','processing','shipped','delivered')),0)::bigint AS spent
     FROM users u LEFT JOIN orders o ON o.user_id = u.id ${w}
     GROUP BY u.id ORDER BY u.created_at DESC LIMIT 200`,
    params,
  );
  res.json({ customers: rows });
});

export default router;
