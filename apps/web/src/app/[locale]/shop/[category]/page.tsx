import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDictionary, type Locale } from '@/lib/i18n';
import { safeApi } from '@/lib/api';
import { pageMeta } from '@/lib/seo';
import type { Category } from '@/lib/types';
import { CatalogView } from '@/components/CatalogView';

async function getCategory(locale: Locale, slug: string) {
  const data = await safeApi<{ categories: Category[] }>(`/api/categories?locale=${locale}`, 300);
  return data?.categories.find((c) => c.slug === slug) || null;
}

export async function generateMetadata(
  props: { params: Promise<{ locale: Locale; category: string }>; searchParams: Promise<Record<string, string>> }
): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const cat = await getCategory(params.locale, params.category);
  if (!cat) return {};
  const dict = getDictionary(params.locale);
  const filtered = Object.keys(searchParams || {}).some((k) => k !== 'page');
  return pageMeta({
    locale: params.locale, path: `/shop/${cat.slug}`, title: cat.name,
    description: cat.description || dict.meta.shopDescription, noindex: filtered || cat.productCount === 0,
  });
}

export default async function CategoryPage(
  props: { params: Promise<{ locale: Locale; category: string }>; searchParams: Promise<Record<string, string>> }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const cat = await getCategory(params.locale, params.category);
  if (!cat) notFound();
  return <CatalogView locale={params.locale} searchParams={searchParams} category={cat} />;
}
