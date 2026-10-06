import crypto from 'node:crypto';

/** Constant-time string comparison: a secret or token must not be recoverable through response timing */
export function safeEqual(a, b) {
  const x = Buffer.from(String(a ?? ''));
  const y = Buffer.from(String(b ?? ''));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
