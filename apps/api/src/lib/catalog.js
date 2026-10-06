import { many, one } from '../db/index.js';
import { pick } from './http.js';

export const BRANDS = {
  'reactive-outdoor': 'Reactive Outdoor',
  'kilos-gear': 'Kilos Gear',
  vanguard: 'Vanguard Outdoor',
};

const productSelect = `
  SELECT p.*, c.slug AS category_slug, c.name AS category_name,
    COALESCE(v.min_price, 0)      AS min_price_cents,
    COALESCE(v.max_price, 0)      AS max_price_cents,
    v.min_compare                 AS compare_at_cents,
    COALESCE(v.total_stock, 0)    AS total_stock,
    COALESCE(v.variants, '[]')    AS variants
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN LATERAL (
    SELECT MIN(price_cents) AS min_price, MAX(price_cents) AS max_price,
           MIN(compare_at_cents) FILTER (WHERE compare_at_cents > price_cents) AS min_compare,
           SUM(GREATEST(stock, 0)) AS total_stock,
           json_agg(json_build_object(
             'id', id, 'sku', sku, 'title', title, 'titleI18n', title_i18n, 'options', options,
             'priceCents', price_cents, 'compareAtCents', compare_at_cents,
             'stock', stock, 'weightGrams', weight_grams) ORDER BY position) AS variants
    FROM product_variants WHERE product_id = p.id
  ) v ON true`;

export function serializeProduct(row, locale, { full = false, admin = false } = {}) {
  const base = {
    id: row.id,
    slug: row.slug,
    brand: row.brand,
    brandName: BRANDS[row.brand] || row.brand,
    title: pick(row.title, locale),
    category: row.category_slug ? { slug: row.category_slug, name: pick(row.category_name, locale) } : null,
    image: row.images?.[0] || null,
    hoverImage: row.images?.[1] || null,
    priceCents: row.min_price_cents,
    maxPriceCents: row.max_price_cents,
    compareAtCents: row.compare_at_cents,
    inStock: row.total_stock > 0,
    featured: row.featured,
    rating: row.rating ? Number(row.rating) : null,
  };
  if (!full) return base;
  const out = {
    ...base,
    description: pick(row.description, locale),
    highlights: pick(row.highlights, locale) || [],
    images: row.images || [],
    tags: row.tags,
    variants: (row.variants || []).map(({ titleI18n, ...v }) => ({
      ...v,
      title: admin ? v.title : (titleI18n?.[locale] || v.title),
      inStock: v.stock > 0,
      ...(admin ? {} : { stock: undefined }),
    })),
    updatedAt: row.updated_at,
  };
  if (admin) {
    Object.assign(out, {
      titleI18n: row.title,
      descriptionI18n: row.description,
      highlightsI18n: row.highlights,
      status: row.status,
      sourceUrl: row.source_url,
      sourceHandle: row.source_handle,
      categoryId: row.category_id,
      totalStock: row.total_stock,
      createdAt: row.created_at,
    });
  }
  return out;
}

const SORTS = {
  featured: 'p.featured DESC, p.created_at DESC',
  newest: 'p.created_at DESC',
  'price-asc': 'min_price_cents ASC',
  'price-desc': 'min_price_cents DESC',
  name: "p.title->>'en' ASC",
};

/**
 * Filterable listing. filters: { q, category, brand, minPrice, maxPrice, inStock, onSale, sort, page, limit, status }
 */
export async function listProducts(filters = {}, { includeInactive = false } = {}) {
  const where = [];
  const params = [];
  const add = (sql, value) => { params.push(value); where.push(sql.replace('?', `$${params.length}`)); };

  if (!includeInactive) where.push(`p.status = 'active'`);
  else if (filters.status) add('p.status = ?', filters.status);
  if (filters.category) {
    const cats = String(filters.category).split(',').filter(Boolean);
    add('c.slug = ANY(?)', cats);
  }
  if (filters.brand) add('p.brand = ANY(?)', String(filters.brand).split(',').filter(Boolean));
  if (filters.q) {
    params.push(`%${String(filters.q).trim()}%`);
    const i = params.length;
    where.push(`(p.title->>'en' ILIKE $${i} OR p.title->>'fr' ILIKE $${i} OR p.title->>'de' ILIKE $${i} OR array_to_string(p.tags, ' ') ILIKE $${i})`);
  }
  if (filters.minPrice != null && filters.minPrice !== '') add('COALESCE(v.min_price,0) >= ?', Math.round(Number(filters.minPrice) * 100));
  if (filters.maxPrice != null && filters.maxPrice !== '') add('COALESCE(v.min_price,0) <= ?', Math.round(Number(filters.maxPrice) * 100));
  if (filters.inStock === 'true' || filters.inStock === true) where.push('COALESCE(v.total_stock,0) > 0');
  if (filters.onSale === 'true' || filters.onSale === true) where.push('v.min_compare IS NOT NULL');

  const limit = Math.min(Math.max(Number(filters.limit) || 24, 1), 100);
  const page = Math.max(Number(filters.page) || 1, 1);
  const order = SORTS[filters.sort] || SORTS.featured;
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const base = `${productSelect} ${whereSql}`;
  const [rows, count, priceRange] = await Promise.all([
    many(`${base} ORDER BY ${order}, p.id LIMIT ${limit} OFFSET ${(page - 1) * limit}`, params),
    one(`SELECT COUNT(*)::int AS n FROM (${base}) t`, params),
    one(`SELECT MIN(min_price_cents)::int AS min, MAX(min_price_cents)::int AS max FROM (${productSelect} WHERE p.status='active') t`),
  ]);
  return { rows, total: count.n, page, limit, pages: Math.ceil(count.n / limit), priceRange };
}

export async function getProduct({ slug, id }, { includeInactive = false } = {}) {
  const cond = slug ? 'p.slug = $1' : 'p.id = $1';
  return one(`${productSelect} WHERE ${cond} ${includeInactive ? '' : "AND p.status = 'active'"}`, [slug || id]);
}

export async function relatedProducts(product, limit = 4) {
  return many(
    `${productSelect} WHERE p.status = 'active' AND p.id <> $1 AND (p.category_id = $2 OR p.brand = $3)
     ORDER BY (p.category_id = $2) DESC, p.featured DESC, random() LIMIT $4`,
    [product.id, product.category_id, product.brand, limit],
  );
}
