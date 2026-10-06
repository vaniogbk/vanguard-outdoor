import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { one } from '../db/index.js';
import { parse, conflict, unauthorized, notFound } from '../lib/http.js';
import { hashPassword, verifyPassword, verifyAgainstDummy, needsRehash, signToken, requireAuth, publicUser } from '../lib/auth.js';
import { COUNTRIES } from '../lib/europe.js';

const router = Router();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false });
// Failed logins per ACCOUNT (not per IP): slows down guessing spread over many addresses against a single e-mail.
// Successful logins are not counted, so a legitimate owner is never locked out by their own sign-ins.
const loginFailures = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 20, skipSuccessfulRequests: true, standardHeaders: 'draft-7', legacyHeaders: false,
  keyGenerator: (req) => `login:${String(req.body?.email ?? '').trim().toLowerCase().slice(0, 200)}`,
});

const addressSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  company: z.string().trim().max(120).optional().default(''),
  line1: z.string().trim().min(3).max(200),
  line2: z.string().trim().max(200).optional().default(''),
  postalCode: z.string().trim().min(2).max(12),
  city: z.string().trim().min(1).max(100),
  country: z.enum(COUNTRIES),
  phone: z.string().trim().max(30).optional().default(''),
});
export { addressSchema };

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(8).max(200),
  firstName: z.string().trim().max(80).optional().default(''),
  lastName: z.string().trim().max(80).optional().default(''),
  locale: z.enum(['en', 'fr', 'de']).optional().default('en'),
  marketingOptIn: z.boolean().optional().default(false),
});

router.post('/register', limiter, async (req, res) => {
  const data = parse(registerSchema, req.body);
  const exists = await one('SELECT 1 FROM users WHERE email = $1', [data.email]);
  if (exists) throw conflict('An account with this email already exists');
  const user = await one(
    `INSERT INTO users(email, password_hash, first_name, last_name, locale, marketing_opt_in)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [data.email, await hashPassword(data.password), data.firstName, data.lastName, data.locale, data.marketingOptIn],
  );
  // Note: guest orders are NOT auto-attached by email (no email verification yet → would leak order data).
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

router.post('/login', limiter, loginFailures, async (req, res) => {
  const { email, password } = parse(
    z.object({ email: z.string().trim().toLowerCase().email().max(200), password: z.string().min(1).max(200) }),
    req.body,
  );
  const user = await one('SELECT * FROM users WHERE email = $1', [email]);
  // Always spend one password derivation, even for an unknown e-mail: same latency, so no account-existence oracle
  const ok = user ? await verifyPassword(password, user.password_hash) : await verifyAgainstDummy(password);
  if (!user || !ok) throw unauthorized('Invalid email or password');
  // legacy bcrypt hashes (and cheaper scrypt parameters) are upgraded transparently
  if (needsRehash(user.password_hash)) {
    await one('UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1 RETURNING 1', [user.id, await hashPassword(password)]);
  }
  res.json({ token: signToken(user), user: publicUser(user) });
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await one('SELECT * FROM users WHERE id = $1', [req.user.id]);
  if (!user) throw notFound('User not found');
  res.json({ user: publicUser(user) });
});

router.patch('/me', requireAuth, async (req, res) => {
  const data = parse(
    z.object({
      firstName: z.string().trim().max(80).optional(),
      lastName: z.string().trim().max(80).optional(),
      locale: z.enum(['en', 'fr', 'de']).optional(),
      defaultAddress: addressSchema.nullable().optional(),
      currentPassword: z.string().optional(),
      newPassword: z.string().min(8).max(200).optional(),
    }),
    req.body,
  );
  const user = await one('SELECT * FROM users WHERE id = $1', [req.user.id]);
  let passwordHash = user.password_hash;
  if (data.newPassword) {
    if (!data.currentPassword || !(await verifyPassword(data.currentPassword, user.password_hash))) {
      throw unauthorized('Current password is incorrect');
    }
    passwordHash = await hashPassword(data.newPassword);
  }
  const updated = await one(
    `UPDATE users SET first_name = COALESCE($2, first_name), last_name = COALESCE($3, last_name),
       locale = COALESCE($4, locale), default_address = CASE WHEN $5::boolean THEN $6::jsonb ELSE default_address END,
       password_hash = $7, updated_at = now()
     WHERE id = $1 RETURNING *`,
    [user.id, data.firstName ?? null, data.lastName ?? null, data.locale ?? null,
      data.defaultAddress !== undefined, data.defaultAddress ? JSON.stringify(data.defaultAddress) : null, passwordHash],
  );
  res.json({ user: publicUser(updated) });
});

export default router;
