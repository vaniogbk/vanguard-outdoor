// Usage: npm run create-admin -- admin@example.com 'StrongPassword!'
import { pool } from '../db/index.js';
import { hashPassword } from '../lib/auth.js';

const [email, password] = process.argv.slice(2);
if (!email || !password || password.length < 10) {
  console.error('Usage: npm run create-admin -- <email> <password (min 10 chars)>');
  process.exit(1);
}
const hash = await hashPassword(password);
await pool.query(
  `INSERT INTO users(email, password_hash, first_name, last_name, role) VALUES ($1,$2,'Store','Admin','admin')
   ON CONFLICT (email) DO UPDATE SET role = 'admin', password_hash = EXCLUDED.password_hash`,
  [email.toLowerCase(), hash],
);
console.log(`✔ ${email} is now an admin`);
await pool.end();
