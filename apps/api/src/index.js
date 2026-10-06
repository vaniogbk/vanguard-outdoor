import config from './config.js';
import { createApp } from './app.js';
import { migrate } from './db/migrate.js';
import { enabledProviders } from './payments/index.js';
import { pool } from './db/index.js';
import { seed } from './db/seed.js';

async function main() {
  // Apply pending migrations on boot (safe: each runs in a transaction, tracked in schema_migrations)
  if (process.env.MIGRATE_ON_BOOT !== 'false') await migrate();
  // First deploy: load the curated starter catalogue + create the admin from ADMIN_EMAIL/ADMIN_PASSWORD
  const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM products');
  if (rows[0].n === 0 && process.env.SEED_ON_EMPTY !== 'false') await seed();
  else if (config.admin.email && config.admin.password) {
    const admin = await pool.query("SELECT 1 FROM users WHERE role = 'admin' LIMIT 1");
    if (!admin.rowCount) await seed(); // idempotent upserts; creates the admin
  }
  const app = createApp();
  app.listen(config.port, () => {
    console.log(`▲ Vanguard Outdoor API on :${config.port} (${config.env})`);
    console.log(`  payment providers: ${enabledProviders().map((p) => p.name).join(', ') || 'NONE configured'}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
