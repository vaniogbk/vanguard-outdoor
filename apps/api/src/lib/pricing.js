import { many } from '../db/index.js';
import { badRequest, pick } from './http.js';
import { includedVat, isShippable, shippingOptions } from './europe.js';

/**
 * Server-side pricing: never trust prices coming from the client.
 * items: [{ variantId, quantity }]
 */
export async function quote({ items, country, shippingMethod = 'standard', locale = 'en' }) {
  if (!Array.isArray(items) || items.length === 0) throw badRequest('Cart is empty');
  const merged = new Map();
  for (const it of items) merged.set(it.variantId, (merged.get(it.variantId) || 0) + it.quantity);

  const ids = [...merged.keys()];
  const rows = await many(
    `SELECT v.id AS variant_id, v.sku, v.title AS variant_title, v.title_i18n, v.price_cents, v.stock, v.weight_grams,
            p.id AS product_id, p.slug, p.title, p.images, p.status
     FROM product_variants v JOIN products p ON p.id = v.product_id
     WHERE v.id = ANY($1::uuid[])`,
    [ids],
  );
  const byId = new Map(rows.map((r) => [r.variant_id, r]));
  const lines = [];
  const problems = [];
  for (const [variantId, quantity] of merged) {
    const r = byId.get(variantId);
    if (!r || r.status !== 'active') { problems.push({ variantId, reason: 'unavailable' }); continue; }
    if (r.stock < quantity) { problems.push({ variantId, reason: 'insufficient_stock', available: Math.max(r.stock, 0) }); }
    lines.push({
      variantId,
      productId: r.product_id,
      slug: r.slug,
      title: pick(r.title, locale),
      variantTitle: r.variant_title === 'Default' ? null : (r.title_i18n?.[locale] || r.variant_title),
      sku: r.sku,
      image: r.images?.[0] || null,
      unitPriceCents: r.price_cents,
      quantity,
      lineTotalCents: r.price_cents * quantity,
      available: Math.max(r.stock, 0),
    });
  }

  const subtotalCents = lines.reduce((s, l) => s + l.lineTotalCents, 0);
  let shipping = null;
  let options = [];
  if (country) {
    if (!isShippable(country)) throw badRequest('We only ship within Europe', { country });
    options = shippingOptions(country, subtotalCents);
    shipping = options.find((o) => o.id === shippingMethod) || options[0];
  }
  const shippingCents = shipping?.priceCents ?? 0;
  const totalCents = subtotalCents + shippingCents;
  const vat = country ? includedVat(totalCents, country) : { rate: 0, cents: 0 };

  return {
    currency: 'EUR',
    lines,
    problems,
    subtotalCents,
    shippingCents,
    shippingMethod: shipping?.id || null,
    shippingOptions: options,
    vatRate: vat.rate,
    vatCents: vat.cents,
    totalCents,
  };
}
