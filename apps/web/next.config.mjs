// Content-Security-Policy: starts in REPORT-ONLY mode (violations show in the browser console, nothing is blocked).
// After a full payment test (card, then Klarna) with a clean console, set CSP_ENFORCE=true on Vercel and redeploy.
const apiOrigin = (() => {
  try { return new URL(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').origin; } catch { return ''; }
})();
const dev = process.env.NODE_ENV !== 'production';
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${dev ? "'unsafe-eval' " : ''}https://*.adyen.com`, // inline: Next.js hydration data (no nonce yet)
  "style-src 'self' 'unsafe-inline' https://*.adyen.com",
  "img-src 'self' data: blob: https://cdn.shopify.com https://kilosgear.com https://fr.reactiveoutdoor.com https://*.adyen.com",
  "font-src 'self' data:",
  `connect-src 'self' ${apiOrigin} https://*.adyen.com`.replace('  ', ' '),
  'frame-src https://*.adyen.com', // Drop-in + 3-D Secure; Klarna uses a redirect, which a CSP does not restrict
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'self'",
].join('; ');
const cspHeader = process.env.CSP_ENFORCE === 'true' ? 'Content-Security-Policy' : 'Content-Security-Policy-Report-Only';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Product photos are resized by Shopify's CDN through a custom loader (src/lib/image-loader.ts), so Next's own image
  // optimizer (/_next/image) is never used. It is left with no allowed remote host to keep its attack surface empty.
  images: { remotePatterns: [] },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: cspHeader, value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
