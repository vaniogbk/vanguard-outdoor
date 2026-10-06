import { Router } from 'express';
import { many } from '../db/index.js';
import { notFound, normalizeLocale, pick } from '../lib/http.js';
import { listProducts, getProduct, relatedProducts, serializeProduct, BRANDS } from '../lib/catalog.js';

const router = Router();

router.get('/categories', async (req, res) => {
  const locale = normalizeLocale(req.query.locale);
  const rows = await many(
    `SELECT c.*, COUNT(p.id) FILTER (WHERE p.status = 'active')::int AS product_count,
       (SELECT p2.images->>0 FROM products p2
         WHERE p2.category_id = c.id AND p2.status = 'active' AND jsonb_array_length(p2.images) > 0
         ORDER BY p2.featured DESC, p2.created_at LIMIT 1) AS cover
     FROM categories c LEFT JOIN products p ON p.category_id = c.id
     GROUP BY c.id ORDER BY c.sort_order, c.id`,
  );
  res.set('Cache-Control', 'public, max-age=60');
  res.json({
    categories: rows.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: pick(c.name, locale),
      description: pick(c.description, locale),
      image: c.image || c.cover,
      productCount: c.product_count,
    })),
  });
});

router.get('/brands', async (_req, res) => {
  const rows = await many(`SELECT brand, COUNT(*)::int AS n FROM products WHERE status='active' GROUP BY brand`);
  res.json({ brands: rows.map((r) => ({ slug: r.brand, name: BRANDS[r.brand] || r.brand, productCount: r.n })) });
});

router.get('/products', async (req, res) => {
  const locale = normalizeLocale(req.query.locale);
  const result = await listProducts(req.query);
  res.set('Cache-Control', 'public, max-age=30');
  res.json({
    products: result.rows.map((r) => serializeProduct(r, locale)),
    pagination: { total: result.total, page: result.page, limit: result.limit, pages: result.pages },
    priceRange: { minCents: result.priceRange?.min ?? 0, maxCents: result.priceRange?.max ?? 0 },
  });
});

// Lightweight list for sitemap generation
router.get('/products-index', async (_req, res) => {
  const rows = await many(`SELECT slug, updated_at FROM products WHERE status = 'active' ORDER BY slug`);
  res.json({ products: rows.map((r) => ({ slug: r.slug, updatedAt: r.updated_at })) });
});

router.get('/products/:slug', async (req, res) => {
  const locale = normalizeLocale(req.query.locale);
  const row = await getProduct({ slug: req.params.slug });
  if (!row) throw notFound('Product not found');
  const related = await relatedProducts(row);
  res.set('Cache-Control', 'public, max-age=30');
  res.json({
    product: serializeProduct(row, locale, { full: true }),
    related: related.map((r) => serializeProduct(r, locale)),
  });
});

export default router;
