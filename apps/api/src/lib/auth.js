import crypto from 'node:crypto';
import { promisify } from 'node:util';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs'; // only used to verify hashes created before the move to scrypt
import config from '../config.js';
import { one } from '../db/index.js';
import { unauthorized, forbidden } from './http.js';

/**
 * Password hashing: scrypt (Node built-in). It runs on libuv's thread pool, so a burst of logins cannot freeze the
 * event loop the way the pure-JS bcrypt did (≈ 1.2 s of main-thread CPU per login → 0.3 s off-thread).
 * Stored format is self-describing — scrypt$<log2 N>$<r>$<p>$<salt>$<key> — so the cost can be raised later
 * without invalidating existing hashes (needsRehash() upgrades them at the next successful login).
 */
const scrypt = promisify(crypto.scrypt);
const LOG2_N = 15; // 32 MiB per derivation
const R = 8;
const P = 1;
const KEYLEN = 64;

const derive = (password, salt, log2n, r, p, length) =>
  scrypt(String(password).normalize('NFKC'), salt, length, { N: 2 ** log2n, r, p, maxmem: 128 * 2 ** log2n * r * 2 });

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = await derive(password, salt, LOG2_N, R, P, KEYLEN);
  return ['scrypt', LOG2_N, R, P, salt.toString('base64url'), key.toString('base64url')].join('$');
}

export async function verifyPassword(password, stored) {
  if (typeof stored !== 'string') return false;
  if (stored.startsWith('$2')) return bcrypt.compare(password, stored); // legacy bcrypt hash
  const [kind, n, r, p, salt, key] = stored.split('$');
  if (kind !== 'scrypt' || !salt || !key) return false;
  const expected = Buffer.from(key, 'base64url');
  const actual = await derive(password, Buffer.from(salt, 'base64url'), Number(n), Number(r), Number(p), expected.length);
  return crypto.timingSafeEqual(actual, expected);
}

/** true for legacy bcrypt hashes and for scrypt hashes made with older (cheaper) parameters */
export const needsRehash = (stored) => !String(stored).startsWith(`scrypt$${LOG2_N}$${R}$${P}$`);

let dummy;
/**
 * Spend the same effort as a real verification when the account does not exist, so the response time does not reveal
 * whether an e-mail address is registered.
 */
export async function verifyAgainstDummy(password) {
  dummy ??= hashPassword('timing-equalisation-only');
  await verifyPassword(password, await dummy);
  return false;
}

export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role, email: user.email }, config.jwtSecret, {
    // an admin session is the most valuable thing to steal: it expires much sooner than a customer's
    expiresIn: user.role === 'admin' ? config.adminJwtExpiresIn : config.jwtExpiresIn,
    issuer: 'vanguard-outdoor',
  });
}

function readToken(req) {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}

function decode(token) {
  try {
    return jwt.verify(token, config.jwtSecret, { issuer: 'vanguard-outdoor', algorithms: ['HS256'] });
  } catch {
    return null;
  }
}

/** Attach req.user if a valid token is present; never rejects */
export function optionalAuth(req, _res, next) {
  const token = readToken(req);
  const payload = token && decode(token);
  if (payload) req.user = { id: payload.sub, role: payload.role, email: payload.email };
  next();
}

export function requireAuth(req, _res, next) {
  const token = readToken(req);
  const payload = token && decode(token);
  if (!payload) return next(unauthorized());
  req.user = { id: payload.sub, role: payload.role, email: payload.email };
  next();
}

export function requireAdmin(req, res, next) {
  requireAuth(req, res, async (err) => {
    if (err) return next(err);
    try {
      // the role inside the token can be days old: read it again, so that demoting or deleting an admin takes effect at once
      const row = await one('SELECT role FROM users WHERE id = $1', [req.user.id]);
      if (!row) return next(unauthorized());
      if (row.role !== 'admin') return next(forbidden());
      req.user.role = row.role;
      next();
    } catch (e) {
      next(e);
    }
  });
}

export const publicUser = (u) => ({
  id: u.id,
  email: u.email,
  firstName: u.first_name,
  lastName: u.last_name,
  role: u.role,
  locale: u.locale,
  defaultAddress: u.default_address,
  createdAt: u.created_at,
});
