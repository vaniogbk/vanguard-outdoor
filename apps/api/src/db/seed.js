import { fileURLToPath } from 'node:url';
import config from '../config.js';
import { pool, tx } from './index.js';
import { migrate } from './migrate.js';
import { categories, products, translateVariant } from './seed-data.js';
import { upsertProduct, usdToEurCents, eurCents } from '../lib/upsert.js';
import { hashPassword } from '../lib/auth.js';

export async function seed({ log = console.log } = {}) {
  await migrate({ log });
  await tx(async (c) => {
    for (const cat of categories) {
      await c.query(
        `INSERT INTO categories(slug, name, description, sort_order) VALUES ($1,$2,$3,$4)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, sort_order = EXCLUDED.sort_order`,
        [cat.slug, cat.name, cat.description, cat.sort],
      );
    }
    const catIds = Object.fromEntries((await c.query('SELECT slug, id FROM categories')).rows.map((r) => [r.slug, r.id]));
    let created = 0;
    for (const p of products) {
      const toCents = p.usd ? usdToEurCents : eurCents;
      const r = await upsertProduct(c, {
        ...p,
        categoryId: catIds[p.category],
        sourceUrl: p.brand === 'kilos-gear' ? `https://kilosgear.com/products/${p.handle}` : `https://fr.reactiveoutdoor.com/products/${p.handle}`,
        variants: p.variants.map((v) => ({
          title: v.title,
          titleI18n: translateVariant(v.title),
          priceCents: toCents(v.price),
          compareAtCents: v.compare ? toCents(v.compare) : null,
          stock: v.stock,
          weightGrams: Math.round(v.kg * 1000),
        })),
      }, { keepStock: true });
      if (r.created) created++;
    }
    log(`✔ ${categories.length} categories, ${products.length} products (${created} new)`);
  });

  // Admin account
  let { email, password } = config.admin;
  if (!email && !config.isProd) { email = 'admin@vanguard.local'; password = 'Admin1234!'; }
  if (email && password) {
    const hash = await hashPassword(password);
    // The password from ADMIN_PASSWORD is authoritative: if someone registered this address before the admin existed,
    // promoting their account WITHOUT replacing its password would hand them the admin role (account pre-hijacking).
    await pool.query(
      `INSERT INTO users(email, password_hash, first_name, last_name, role) VALUES ($1,$2,'Store','Admin','admin')
       ON CONFLICT (email) DO UPDATE SET role = 'admin', password_hash = EXCLUDED.password_hash, updated_at = now()`,
      [email.toLowerCase(), hash],
    );
    log(`✔ admin account: ${email}${config.isProd ? '' : ` / ${password}`}`);
  } else {
    log('ℹ No ADMIN_EMAIL/ADMIN_PASSWORD set — run `npm run create-admin` later.');
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seed().then(() => pool.end()).catch((e) => { console.error(e); process.exit(1); });
}
