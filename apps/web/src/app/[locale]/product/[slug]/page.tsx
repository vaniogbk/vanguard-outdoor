import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDictionary, t, type Locale } from '@/lib/i18n';
import { safeApi, SITE_URL } from '@/lib/api';
import { pageMeta } from '@/lib/seo';
import type { Product, ProductSummary } from '@/lib/types';
import { AddToCart } from '@/components/AddToCart';
import { Gallery } from '@/components/Gallery';
import { ProductCard } from '@/components/ProductCard';
import { JsonLd } from '@/components/JsonLd';
import { Reveal } from '@/components/Reveal';
import { IconCheck, IconStar } from '@/components/icons';

export const revalidate = 60;

// Opts this dynamic route into on-demand ISR: a page is rendered on its first visit, then served from the cache and
// refreshed in the background every 60 s. Without this export every product view is a full server render.
export async function generateStaticParams() {
  return [];
}

const getProduct = (locale: Locale, slug: string) =>
  safeApi<{ product: Product; related: ProductSummary[] }>(`/api/products/${encodeURIComponent(slug)}?locale=${locale}`, 60);

export async function generateMetadata(props: { params: Promise<{ locale: Locale; slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const data = await getProduct(params.locale, params.slug);
  if (!data) return {};
  const p = data.product;
  const description = (p.description || '').replace(/\s+/g, ' ').slice(0, 155);
  return pageMeta({ locale: params.locale, path: `/product/${p.slug}`, title: `${p.title} — ${p.brandName}`, description, images: p.images.slice(0, 1) });
}

export default async function ProductPage(props: { params: Promise<{ locale: Locale; slug: string }> }) {
  const params = await props.params;
  const { locale } = params;
  const data = await getProduct(locale, params.slug);
  if (!data) notFound();
  const { product: p, related } = data;
  const dict = getDictionary(locale);
  const url = `${SITE_URL}/${locale}/product/${p.slug}`;

  return (
    <div className="container-site pt-6">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: p.title,
        description: p.description,
        image: p.images,
        sku: p.variants[0]?.sku,
        brand: { '@type': 'Brand', name: p.brandName },
        category: p.category?.name,
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: 'EUR',
          lowPrice: (p.priceCents / 100).toFixed(2),
          highPrice: (p.maxPriceCents / 100).toFixed(2),
          offerCount: p.variants.length,
          availability: p.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          url,
          seller: { '@type': 'Organization', name: 'Vanguard Outdoor' },
          shippingDetails: { '@type': 'OfferShippingDetails', shippingDestination: { '@type': 'DefinedRegion', addressCountry: ['FR', 'DE', 'BE', 'NL', 'AT', 'IT', 'ES'] } },
          hasMerchantReturnPolicy: { '@type': 'MerchantReturnPolicy', merchantReturnDays: 30, returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow' },
        },
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: dict.nav.shop, item: `${SITE_URL}/${locale}/shop` },
          ...(p.category ? [{ '@type': 'ListItem', position: 2, name: p.category.name, item: `${SITE_URL}/${locale}/shop/${p.category.slug}` }] : []),
          { '@type': 'ListItem', position: p.category ? 3 : 2, name: p.title, item: url },
        ],
      }} />

      <nav className="flex flex-wrap items-center gap-1.5 text-xs text-mute" aria-label="Breadcrumb">
        <Link href={`/${locale}/shop`} className="transition-colors hover:text-ink">{dict.nav.shop}</Link>
        {p.category && (<><span aria-hidden="true">/</span><Link href={`/${locale}/shop/${p.category.slug}`} className="transition-colors hover:text-ink">{p.category.name}</Link></>)}
        <span aria-hidden="true">/</span><span className="text-ink">{p.title}</span>
      </nav>

      <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14">
        <Gallery images={p.images} title={p.title} category={p.category?.slug} />
        <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <p className="eyebrow">{t(dict.product.by, { brand: p.brandName })}</p>
          <h1 className="mt-3 text-3xl font-extrabold uppercase leading-[1.02] tracking-tight sm:text-4xl">{p.title}</h1>
          {p.rating && (
            <p className="mt-3 flex items-center gap-1 text-sm">
              {[1, 2, 3, 4, 5].map((i) => <IconStar key={i} width={14} height={14} className={i <= Math.round(p.rating!) ? 'text-signal' : 'text-paper-200'} />)}
              <span className="ml-1 font-semibold">{p.rating.toFixed(1)}</span>
            </p>
          )}
          <div className="mt-6"><AddToCart product={p} /></div>

          {p.highlights.length > 0 && (
            <div className="mt-9">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink/70">{dict.product.highlights}</h2>
              <ul className="mt-3 space-y-2.5">
                {p.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2.5 text-sm">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-moss/10 text-moss"><IconCheck width={12} height={12} /></span>{h}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {p.description && (
            <div className="mt-9">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink/70">{dict.product.description}</h2>
              <div className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-ink/80">{p.description}</div>
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="pt-24">
          <Reveal><h2 className="h-section">{dict.product.related}</h2></Reveal>
          <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-4 lg:grid-cols-4">
            {related.map((r, i) => (
              <Reveal key={r.id} delay={(i % 4) * 80}>
                <ProductCard product={r} locale={locale} dict={dict} />
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
