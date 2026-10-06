import type { MetadataRoute } from 'next';
import { safeApi, SITE_URL } from '@/lib/api';
import { locales } from '@/lib/i18n';
import type { Category } from '@/lib/types';

export const revalidate = 3600;

function entry(path: string, lastModified?: string, priority = 0.7): MetadataRoute.Sitemap[number] {
  return {
    url: `${SITE_URL}/en${path}`,
    lastModified: lastModified ? new Date(lastModified) : new Date(),
    priority,
    alternates: { languages: Object.fromEntries(locales.map((l) => [l, `${SITE_URL}/${l}${path}`])) },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, cats] = await Promise.all([
    safeApi<{ products: { slug: string; updatedAt: string }[] }>('/api/products-index', 3600),
    safeApi<{ categories: Category[] }>('/api/categories', 3600),
  ]);
  const paths: MetadataRoute.Sitemap = [entry('', undefined, 1), entry('/shop', undefined, 0.9)];
  for (const c of cats?.categories || []) if (c.productCount > 0) paths.push(entry(`/shop/${c.slug}`, undefined, 0.8));
  for (const p of products?.products || []) paths.push(entry(`/product/${p.slug}`, p.updatedAt, 0.7));
  for (const page of ['shipping', 'returns', 'terms', 'privacy', 'imprint']) paths.push(entry(`/legal/${page}`, undefined, 0.2));
  // one URL entry per locale, each carrying hreflang alternates
  return paths.flatMap((e) => locales.map((l) => ({ ...e, url: e.url.replace(`${SITE_URL}/en`, `${SITE_URL}/${l}`) })));
}
