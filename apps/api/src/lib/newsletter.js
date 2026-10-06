import crypto from 'node:crypto';
import config from '../config.js';

/**
 * Signed unsubscribe link for the footer of every marketing e-mail (legal requirement). The token is an HMAC of the
 * address, so nobody can unsubscribe (or probe) other people's addresses, and nothing needs to be stored.
 *
 *   import { unsubscribeUrl } from '../lib/newsletter.js';   →  `${unsubscribeUrl(email, locale)}`
 */
export const unsubscribeToken = (email) =>
  crypto.createHmac('sha256', config.jwtSecret).update(`newsletter-unsubscribe:${String(email).trim().toLowerCase()}`).digest('base64url').slice(0, 32);

export const unsubscribeUrl = (email, locale = 'en') =>
  `${config.frontendUrl}/${locale}/newsletter/unsubscribe?e=${encodeURIComponent(email)}&t=${unsubscribeToken(email)}`;
