import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import '../globals.css';
import { getDictionary, isLocale, locales, type Locale } from '@/lib/i18n';
import { Providers } from '@/lib/providers';
import { safeApi, SITE_URL } from '@/lib/api';
import { pageMeta } from '@/lib/seo';
import type { Category } from '@/lib/types';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { JsonLd } from '@/components/JsonLd';
import { THEME, THEME_HEX } from '@/lib/theme';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.locale)) return {};
  const dict = getDictionary(params.locale);
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: dict.meta.title, template: '%s · Vanguard Outdoor' },
    applicationName: 'Vanguard Outdoor',
    ...pageMeta({ locale: params.locale, title: dict.meta.title, description: dict.meta.description }),
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = { themeColor: THEME_HEX.ink, width: 'device-width', initialScale: 1 };

export default async function LocaleLayout({ children, params: routeParams }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const params = await routeParams;
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const dict = getDictionary(locale);
  const data = await safeApi<{ categories: Category[] }>(`/api/categories?locale=${locale}`, 300);
  const categories = (data?.categories || []).map(({ slug, name, productCount }) => ({ slug, name, productCount }));

  return (
    <html lang={locale} data-theme={THEME} className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        {/* product photos and the hero come from Shopify's CDN: open that connection before the <img> tags are discovered */}
        <link rel="preconnect" href="https://cdn.shopify.com" crossOrigin="anonymous" />
      </head>
      <body className="flex min-h-screen flex-col font-sans">
        <a href="#main" className="skip-link">{dict.common.skip}</a>
        <JsonLd data={{
          '@context': 'https://schema.org',
          '@type': 'OnlineStore',
          name: 'Vanguard Outdoor',
          url: `${SITE_URL}/${locale}`,
          logo: `${SITE_URL}/icon.svg`,
          areaServed: 'Europe',
          currenciesAccepted: 'EUR',
          potentialAction: { '@type': 'SearchAction', target: `${SITE_URL}/${locale}/shop?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
        }} />
        <Providers dict={dict} locale={locale}>
          <Header categories={categories} />
          <main id="main" className="flex-1">{children}</main>
          <Footer dict={dict} locale={locale} categories={categories} />
        </Providers>
      </body>
    </html>
  );
}
