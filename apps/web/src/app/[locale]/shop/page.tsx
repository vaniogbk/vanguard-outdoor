import type { Metadata } from 'next';
import { getDictionary, type Locale } from '@/lib/i18n';
import { pageMeta } from '@/lib/seo';
import { CatalogView } from '@/components/CatalogView';

export async function generateMetadata(
  props: { params: Promise<{ locale: Locale }>; searchParams: Promise<Record<string, string>> }
): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const dict = getDictionary(params.locale);
  const filtered = Object.keys(searchParams || {}).some((k) => k !== 'page');
  return pageMeta({ locale: params.locale, path: '/shop', title: dict.meta.shopTitle, description: dict.meta.shopDescription, noindex: filtered });
}

export default async function ShopPage(
  props: { params: Promise<{ locale: Locale }>; searchParams: Promise<Record<string, string>> }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  return <CatalogView locale={params.locale} searchParams={searchParams} />;
}
