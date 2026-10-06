import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { Locale } from '@/lib/i18n';
import { pageMeta } from '@/lib/seo';
import { LEGAL, type LegalPage } from '@/lib/legal';

export function generateStaticParams() {
  return Object.keys(LEGAL.en).map((page) => ({ page }));
}

export async function generateMetadata(props: { params: Promise<{ locale: Locale; page: string }> }): Promise<Metadata> {
  const params = await props.params;
  const doc = LEGAL[params.locale]?.[params.page as LegalPage];
  if (!doc) return {};
  return pageMeta({ locale: params.locale, path: `/legal/${params.page}`, title: doc.title, description: doc.sections[0]?.[1].slice(0, 150) || doc.title });
}

export default async function LegalPageView(props: { params: Promise<{ locale: Locale; page: string }> }) {
  const params = await props.params;
  const doc = LEGAL[params.locale]?.[params.page as LegalPage];
  if (!doc) notFound();
  return (
    <article className="container-site max-w-3xl py-16">
      <h1 className="h-display text-4xl">{doc.title}</h1>
      <div className="prose-vg mt-10">
        {doc.sections.map(([h, body]) => (
          <section key={h}><h2>{h}</h2><p className="whitespace-pre-line">{body}</p></section>
        ))}
      </div>
    </article>
  );
}
