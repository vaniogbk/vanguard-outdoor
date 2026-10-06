import type { Metadata } from 'next';
import { SITE_URL } from './api';
import { locales, ogLocales, type Locale } from './i18n';

/** Canonical + hreflang alternates for a path without locale prefix ("/shop/camping") */
export function alternates(locale: Locale, path = '') {
  const languages: Record<string, string> = {};
  for (const l of locales) languages[l] = `${SITE_URL}/${l}${path}`;
  languages['x-default'] = `${SITE_URL}/en${path}`;
  return { canonical: `${SITE_URL}/${locale}${path}`, languages };
}

export function pageMeta({ locale, path = '', title, description, images, noindex }: {
  locale: Locale; path?: string; title: string; description: string; images?: string[]; noindex?: boolean;
}): Metadata {
  return {
    title,
    description,
    alternates: alternates(locale, path),
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${locale}${path}`,
      siteName: 'Vanguard Outdoor',
      locale: ogLocales[locale],
      alternateLocale: locales.filter((l) => l !== locale).map((l) => ogLocales[l]),
      type: 'website',
      ...(images?.length ? { images: images.map((url) => ({ url })) } : {}),
    },
    twitter: { card: 'summary_large_image', title, description },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  };
}
