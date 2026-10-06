/** Storefront theme — NEXT_PUBLIC_THEME=forest (default) | classic */
export type Theme = 'forest' | 'classic';
export const THEME: Theme = process.env.NEXT_PUBLIC_THEME === 'classic' ? 'classic' : 'forest';

/** Hex values for places where CSS variables can't be used (OG image, browser theme-color, favicon) */
export const THEME_HEX = {
  forest: { ink: '#16291F', accent: '#A9C27A', signal: '#B4521F', moss: '#52703F', paper: '#F7F4EC' },
  classic: { ink: '#0A0A0A', accent: '#D7261E', signal: '#D7261E', moss: '#D7261E', paper: '#FFFFFF' },
}[THEME];

/** Hero background photo (served by the brands' Shopify CDN). Replace with any lifestyle shot. */
export const HERO_IMAGE = 'https://cdn.shopify.com/s/files/1/0366/1889/5405/files/Carousel_5_-_People_4_5409aa5e-6185-4bca-a061-b2906c20626b.jpg?v=1765854528';
