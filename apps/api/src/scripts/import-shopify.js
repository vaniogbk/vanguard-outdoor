/**
 * Full catalogue sync from the two partner Shopify stores (public /products.json feed).
 *
 *   npm run import:catalog                       # both stores, add + update
 *   npm run import:catalog -- --brand=kilos-gear # one store
 *   npm run import:catalog -- --draft            # new products land as "draft" for review in the admin
 *   npm run import:catalog -- --sync-stock       # overwrite stock from upstream availability
 *   npm run import:catalog -- --archive-missing  # archive products no longer in the source feed (full mirror)
 *   npm run import:catalog -- --dry-run          # print what would be imported
 *
 * Only use with the brands' authorisation (reseller / distribution agreement) — product photos and
 * descriptions are their copyrighted material.
 */
import { fileURLToPath } from 'node:url';
import config from '../config.js';
import { pool, tx } from '../db/index.js';
import { migrate } from '../db/migrate.js';
import { upsertProduct, usdToEurCents, eurCents } from '../lib/upsert.js';

export const SOURCES = [
  { brand: 'reactive-outdoor', base: process.env.REACTIVE_STORE_URL || 'https://fr.reactiveoutdoor.com', currency: 'EUR' },
  { brand: 'kilos-gear', base: process.env.KILOS_STORE_URL || 'https://kilosgear.com', currency: 'USD' },
];

// Reactive Outdoor publishes one listing per region; keep EU/FR/DE versions only
const NON_EU_REGION = /[(,]\s*(US|AU|CA|UK|NZ)\s*\)\s*$/i;
const SKIP = /\b(test|gift ?card|carte cadeau|insurance|shipping protection|route|warranty)\b/i;

const CATEGORY_RULES = [
  ['clothing', /\b(jacket|shirt|t-shirt|hoodie|pants|trousers|shorts|hat|cap|beanie|glove|sock|veste|vêtement|pantalon|chapeau|jacke|hose|mütze|handschuh)\b/i],
  ['transport', /\b(wagon|chariot|bollerwagen|cart|trolley|beach)\b/i],
  ['camping', /\b(tent|tente|zelt|cabana|shelter|abri|screen|bugout|tarp|bâche|plane|kabinenzelt|3-sekunden)\b/i],
  ['sleeping', /\b(sleeping|matelas|isomatte|hammock|hamac|hängematte|sleep|pillow|oreiller|kissen|quilt|sac de couchage|schlafsack)\b/i],
  ['furniture', /\b(chair|chaise|stuhl|table|tisch|stool|tabouret|hocker|throne|lounge|cot|lit de camp)\b/i],
  ['lighting', /\b(light|lamp|lantern|headlamp|frontale|lampe|leuchte|licht|lumière|torch|flashlight)\b/i],
  ['hiking', /\b(packing|cube|backpack|rucksack|sac à dos|bottle|gourde|trekking|pole|bâton)\b/i],
];

export function categorize(text) {
  for (const [slug, re] of CATEGORY_RULES) if (re.test(text)) return slug;
  return 'accessories';
}

export function htmlToText(html = '') {
  return String(html)
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
    .replace(/<\s*(br|\/p|\/li|\/h[1-6]|\/div)\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n\n')
    .trim()
    .slice(0, 5000);
}

async function fetchJson(url, attempt = 1) {
  const res = await fetch(url, { headers: { 'User-Agent': 'VanguardOutdoorCatalogSync/1.0', Accept: 'application/json' } });
  if (res.status === 429 && attempt < 6) {
    await new Promise((r) => setTimeout(r, 1500 * attempt));
    return fetchJson(url, attempt + 1);
  }
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.json();
}

export async function fetchAll(base) {
  const all = [];
  for (let page = 1; page <= 40; page++) {
    const { products } = await fetchJson(`${base}/products.json?limit=250&page=${page}`);
    if (!products?.length) break;
    all.push(...products);
    if (products.length < 250) break;
  }
  return all;
}

export function mapProduct(src, source, { defaultStock = 50 } = {}) {
  const toCents = source.currency === 'USD' ? usdToEurCents : eurCents;
  const variants = (src.variants || [])
    .filter((v) => Number(v.price) > 0)
    .map((v) => ({
      sku: `${source.brand === 'kilos-gear' ? 'KG' : 'RO'}-${v.id}`,
      sourceVariantId: String(v.id),
      title: v.title === 'Default Title' ? 'Default' : v.title,
      options: Object.fromEntries(
        (src.options || []).map((o, i) => [o.name, v[`option${i + 1}`]]).filter(([, val]) => val && val !== 'Default Title'),
      ),
      priceCents: toCents(v.price),
      compareAtCents: v.compare_at_price && Number(v.compare_at_price) > Number(v.price) ? toCents(v.compare_at_price) : null,
      stock: v.available === false ? 0 : defaultStock,
      weightGrams: v.grams || 1000,
    }));
  const text = `${src.title} ${src.product_type || ''} ${(src.tags || []).join(' ')}`;
  const desc = htmlToText(src.body_html);
  return {
    brand: source.brand,
    handle: src.handle,
    sourceUrl: `${source.base}/products/${src.handle}`,
    category: categorize(text),
    title: { en: src.title, fr: src.title, de: src.title },
    description: { en: desc, fr: desc, de: desc },
    highlights: { en: [], fr: [], de: [] },
    images: (src.images || []).map((i) => i.src).slice(0, 12),
    tags: (src.tags || []).filter((t) => !/tracking|ocu_|finance/i.test(t)).slice(0, 15),
    variants,
  };
}

export function shouldSkip(src) {
  return SKIP.test(src.title) || NON_EU_REGION.test(src.title) || !(src.variants || []).some((v) => Number(v.price) > 0);
}

/**
 * opts: { brand?, dryRun?, draft?, syncStock?, archiveMissing?, log? }
 * Returns a per-brand summary. Used by the CLI and by POST /api/admin/catalog/import.
 */
export async function runImport(opts = {}) {
  const log = opts.log || console.log;
  const defaultStock = Number(process.env.IMPORT_DEFAULT_STOCK || 50);
  await migrate({ log: () => {} });
  const catIds = Object.fromEntries((await pool.query('SELECT slug, id FROM categories')).rows.map((r) => [r.slug, r.id]));
  if (!Object.keys(catIds).length) throw new Error('No categories — run `npm run seed` first.');
  const summary = [];

  for (const source of SOURCES.filter((s) => !opts.brand || s.brand === opts.brand)) {
    log(`\n⇣ ${source.brand} — ${source.base}`);
    const raw = await fetchAll(source.base);
    const kept = raw.filter((p) => !shouldSkip(p));
    log(`  ${raw.length} products in feed, ${kept.length} kept (${raw.length - kept.length} skipped: tests/regional duplicates/unpriced)`);
    const stats = { brand: source.brand, feed: raw.length, kept: kept.length, created: 0, updated: 0, archived: 0 };
    if (opts.dryRun) {
      for (const p of kept) {
        const m = mapProduct(p, source, { defaultStock });
        log(`  · [${m.category}] ${m.title.en} — ${m.variants.length} variant(s) from €${(Math.min(...m.variants.map((v) => v.priceCents)) / 100).toFixed(2)}`);
      }
      summary.push(stats);
      continue;
    }
    await tx(async (c) => {
      for (const p of kept) {
        const m = mapProduct(p, source, { defaultStock });
        const r = await upsertProduct(c, {
          ...m,
          categoryId: catIds[m.category] ?? catIds.accessories,
          status: opts.draft ? 'draft' : 'active',
        }, { keepStock: !opts.syncStock, keepCopy: true });
        stats[r.created ? 'created' : 'updated']++;
      }
      if (opts.archiveMissing) {
        const { rowCount } = await c.query(
          `UPDATE products SET status = 'archived', updated_at = now()
           WHERE brand = $1 AND status <> 'archived' AND NOT (source_handle = ANY($2::text[]))`,
          [source.brand, kept.map((p) => p.handle)],
        );
        stats.archived = rowCount;
      }
    });
    log(`  ✔ ${stats.created} created, ${stats.updated} updated${opts.archiveMissing ? `, ${stats.archived} archived` : ''}`);
    summary.push(stats);
  }
  log(`\nPrices: EUR stores ×${config.catalog.priceMultiplier}; USD stores ×${config.catalog.usdToEur} FX ×${config.catalog.priceMultiplier}.`);
  return summary;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  await runImport({
    brand: [...args].find((a) => a.startsWith('--brand='))?.split('=')[1],
    dryRun: args.has('--dry-run'),
    draft: args.has('--draft'),
    syncStock: args.has('--sync-stock'),
    archiveMissing: args.has('--archive-missing'),
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().then(() => pool.end()).catch((e) => { console.error(e.message); process.exit(1); });
}
