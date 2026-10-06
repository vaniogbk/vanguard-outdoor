import Link from 'next/link';
import { Suspense } from 'react';
import { getDictionary, t, type Locale } from '@/lib/i18n';
import { safeApi } from '@/lib/api';
import type { Category, ProductSummary } from '@/lib/types';
import { ProductCard } from './ProductCard';
import { Filters, SortSelect } from './Filters';
import { JsonLd } from './JsonLd';
import { Reveal } from './Reveal';
import { IconArrow, IconSearch } from './icons';
import { SITE_URL } from '@/lib/api';

type Search = Record<string, string | string[] | undefined>;
const ALLOWED = ['q', 'brand', 'minPrice', 'maxPrice', 'inStock', 'onSale', 'sort', 'page', 'category'];

export async function CatalogView({ locale, searchParams, category }: { locale: Locale; searchParams: Search; category?: Category | null }) {
  const dict = getDictionary(locale);
  const qs = new URLSearchParams({ locale, limit: '24' });
  for (const k of ALLOWED) {
    const v = searchParams[k];
    if (typeof v === 'string' && v) qs.set(k, v);
  }
  if (category) qs.set('category', category.slug);

  const [data, cats, brands] = await Promise.all([
    safeApi<{ products: ProductSummary[]; pagination: { total: number; page: number; pages: number }; priceRange: { minCents: number; maxCents: number } }>(`/api/products?${qs}`, 30),
    safeApi<{ categories: Category[] }>(`/api/categories?locale=${locale}`, 300),
    safeApi<{ brands: { slug: string; name: string; productCount: number }[] }>(`/api/brands`, 300),
  ]);
  const products = data?.products || [];
  const pg = data?.pagination || { total: 0, page: 1, pages: 1 };
  const base = category ? `/${locale}/shop/${category.slug}` : `/${locale}/shop`;
  const pageHref = (p: number) => {
    const s = new URLSearchParams();
    for (const k of ALLOWED) { const v = searchParams[k]; if (typeof v === 'string' && v && k !== 'page') s.set(k, v); }
    if (p > 1) s.set('page', String(p));
    return `${base}${s.toString() ? `?${s}` : ''}`;
  };
  const search = typeof searchParams.q === 'string' ? searchParams.q : '';

  return (
    <div className="container-site pb-10 pt-8">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Vanguard Outdoor', item: `${SITE_URL}/${locale}` },
          { '@type': 'ListItem', position: 2, name: dict.nav.shop, item: `${SITE_URL}/${locale}/shop` },
          ...(category ? [{ '@type': 'ListItem', position: 3, name: category.name, item: `${SITE_URL}${base}` }] : []),
        ],
      }} />
      <nav className="flex flex-wrap items-center gap-1.5 text-xs text-mute" aria-label="Breadcrumb">
        <Link href={`/${locale}`} className="transition-colors hover:text-ink">Vanguard Outdoor</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/${locale}/shop`} className="transition-colors hover:text-ink">{dict.nav.shop}</Link>
        {category && (<><span aria-hidden="true">/</span><span className="text-ink">{category.name}</span></>)}
      </nav>
      <div className="mt-4 flex flex-col gap-3 border-b border-paper-200 pb-7 lg:flex-row lg:items-end lg:justify-between">
        <div className="animate-fade-up">
          <h1 className="display-lg h-display">{category?.name || (search ? `“${search}”` : dict.catalog.title)}</h1>
          {category?.description && <p className="mt-3 max-w-2xl text-mute">{category.description}</p>}
        </div>
        <p className="chip-soft self-start lg:self-auto">{t(dict.catalog.results, { count: pg.total })}</p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-10">
        <Suspense>
          <Filters
            categories={(cats?.categories || []).filter((c) => c.productCount > 0).map((c) => ({ slug: c.slug, name: c.name, count: c.productCount }))}
            brands={(brands?.brands || []).map((b) => ({ slug: b.slug, name: b.name, count: b.productCount }))}
            activeCategory={category?.slug}
          />
        </Suspense>
        <div className="min-w-0">
          <div className="mb-6 hidden justify-end lg:flex"><Suspense><SortSelect /></Suspense></div>
          {products.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-paper-200 bg-paper-50/50 py-24 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-white text-ink/50 shadow-soft"><IconSearch width={22} height={22} /></span>
              <p className="text-mute">{dict.catalog.empty}</p>
              <Link href={base} className="btn-outline btn-sm">{dict.catalog.clear}</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-4 sm:gap-y-10 md:grid-cols-3">
              {products.map((p, i) => (
                <Reveal key={p.id} delay={(i % 3) * 70}>
                  <ProductCard product={p} locale={locale} dict={dict} priority={i < 3} as="h2" />
                </Reveal>
              ))}
            </div>
          )}
          {pg.pages > 1 && (
            <nav className="mt-14 flex items-center justify-center gap-3 text-sm" aria-label="Pagination">
              {pg.page > 1 ? <Link href={pageHref(pg.page - 1)} className="btn-outline btn-sm" rel="prev"><IconArrow width={14} height={14} className="rotate-180" />{dict.catalog.prev}</Link> : <span className="w-24" />}
              <span className="chip-soft tabular-nums">{t(dict.catalog.page, { page: pg.page, pages: pg.pages })}</span>
              {pg.page < pg.pages ? <Link href={pageHref(pg.page + 1)} className="btn-outline btn-sm" rel="next">{dict.catalog.next}<IconArrow width={14} height={14} /></Link> : <span className="w-24" />}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
