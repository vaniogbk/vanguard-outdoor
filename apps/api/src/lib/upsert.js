import config from '../config.js';

export const slugify = (s) =>
  String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[™®©]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

/** USD → EUR with psychological .95 ending, then optional margin multiplier */
export function usdToEurCents(usd) {
  const eur = Number(usd) * config.catalog.usdToEur * config.catalog.priceMultiplier;
  return Math.max(Math.round((Math.ceil(eur) - 0.05) * 100), 0);
}

export const eurCents = (eur) => Math.round(Number(eur) * config.catalog.priceMultiplier * 100);

const BRAND_PREFIX = { 'reactive-outdoor': 'RO', 'kilos-gear': 'KG', vanguard: 'VG' };

/**
 * Insert or update a product identified by (brand, source_handle) and sync its variants by SKU.
 * p: { brand, handle, categoryId, title, description, highlights, images, tags, featured, rating, sourceUrl, status,
 *      variants: [{ title, priceCents, compareAtCents, stock, weightGrams, options, sku?, sourceVariantId? }] }
 * opts.keepStock: don't overwrite stock of existing variants (importer re-runs)
 */
export async function upsertProduct(c, p, { keepStock = false, keepCopy = false } = {}) {
  const slugBase = slugify(p.slug || p.title.en);
  const existing = (await c.query('SELECT id, slug FROM products WHERE brand = $1 AND source_handle = $2', [p.brand, p.handle])).rows[0];
  let slug = existing?.slug || slugBase;
  if (!existing) {
    const clash = (await c.query('SELECT 1 FROM products WHERE slug = $1', [slug])).rows[0];
    if (clash) slug = `${slugBase}-${BRAND_PREFIX[p.brand].toLowerCase()}`;
  }

  let productId;
  if (existing) {
    productId = existing.id;
    await c.query(
      `UPDATE products SET category_id = COALESCE($2, category_id), images = $3, tags = $4, source_url = $5,
         title = CASE WHEN $6 THEN title ELSE $7 END,
         description = CASE WHEN $6 THEN description ELSE $8 END,
         highlights = CASE WHEN $6 THEN highlights ELSE $9 END,
         updated_at = now()
       WHERE id = $1`,
      [productId, p.categoryId ?? null, JSON.stringify(p.images || []), p.tags || [], p.sourceUrl || null,
        keepCopy, p.title, p.description || {}, p.highlights || {}],
    );
  } else {
    const { rows } = await c.query(
      `INSERT INTO products(slug, brand, source_handle, source_url, category_id, title, description, highlights, images, tags, status, featured, rating)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
      [slug, p.brand, p.handle, p.sourceUrl || null, p.categoryId ?? null, p.title, p.description || {}, p.highlights || {},
        JSON.stringify(p.images || []), p.tags || [], p.status || 'active', Boolean(p.featured), p.rating ?? null],
    );
    productId = rows[0].id;
  }

  const prefix = BRAND_PREFIX[p.brand];
  const keep = [];
  for (const [i, v] of p.variants.entries()) {
    const sku = v.sku || `${prefix}-${slugify(p.handle).slice(0, 40).toUpperCase()}-${i + 1}`;
    const { rows } = await c.query(
      `INSERT INTO product_variants(product_id, sku, title, options, price_cents, compare_at_cents, stock, weight_grams, position, source_variant_id, title_i18n)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$12)
       ON CONFLICT (sku) DO UPDATE SET title = EXCLUDED.title, title_i18n = EXCLUDED.title_i18n, options = EXCLUDED.options, price_cents = EXCLUDED.price_cents,
         compare_at_cents = EXCLUDED.compare_at_cents, weight_grams = EXCLUDED.weight_grams, position = EXCLUDED.position,
         stock = CASE WHEN $11 THEN product_variants.stock ELSE EXCLUDED.stock END
       RETURNING id`,
      [productId, sku, v.title || 'Default', v.options || {}, v.priceCents, v.compareAtCents ?? null, v.stock ?? 0,
        v.weightGrams ?? 1000, i, v.sourceVariantId || null, keepStock, v.titleI18n || {}],
    );
    keep.push(rows[0].id);
  }
  // remove variants no longer present upstream (only if never ordered — FK is SET NULL anyway)
  await c.query('DELETE FROM product_variants WHERE product_id = $1 AND NOT (id = ANY($2::uuid[]))', [productId, keep]);
  return { id: productId, created: !existing };
}
