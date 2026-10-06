import type { ImageLoaderProps } from 'next/image';

/** Shopify CDN resizes on the fly with ?width= — avoids paying for Vercel image optimisation */
export default function shopifyLoader({ src, width }: ImageLoaderProps) {
  if (!src.includes('cdn.shopify.com') && !src.includes('/cdn/shop/')) return src;
  const url = new URL(src);
  url.searchParams.set('width', String(width));
  return url.toString();
}
