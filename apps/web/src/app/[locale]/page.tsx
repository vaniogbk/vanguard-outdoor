import Link from 'next/link';
import { getDictionary, t, type Locale } from '@/lib/i18n';
import { safeApi } from '@/lib/api';
import type { Category, ProductSummary } from '@/lib/types';
import { ProductCard } from '@/components/ProductCard';
import { ProductImage } from '@/components/ProductImage';
import { CategoryGlyph, IconArrow, IconArrowUpRight, IconLock, IconReturn, IconShield, IconTruck } from '@/components/icons';
import { Newsletter } from '@/components/Newsletter';
import { HeroBackdrop } from '@/components/HeroBackdrop';
import { Reveal } from '@/components/Reveal';
import { HERO_IMAGE } from '@/lib/theme';

export const revalidate = 120;

const USP_ICONS = [IconTruck, IconLock, IconReturn, IconShield];

export default async function Home(props: { params: Promise<{ locale: Locale }> }) {
  const params = await props.params;
  const { locale } = params;
  const dict = getDictionary(locale);
  const [featured, cats] = await Promise.all([
    safeApi<{ products: ProductSummary[] }>(`/api/products?locale=${locale}&sort=featured&limit=8`, 120),
    safeApi<{ categories: Category[] }>(`/api/categories?locale=${locale}`, 300),
  ]);
  const categories = (cats?.categories || []).filter((c) => c.productCount > 0);
  const products = featured?.products || [];
  const lines = dict.home.heroTitle.split('. ');
  const trust = dict.announcement.split(' · ');

  return (
    <>
      {/* ───── Hero ───── */}
      <section className="relative isolate overflow-hidden bg-ink text-white">
        <HeroBackdrop image={HERO_IMAGE} />
        <div className="container-site relative grid min-h-[min(84svh,740px)] items-center pb-36 pt-14 sm:pb-40">
          <div className="max-w-3xl">
            <p className="eyebrow-dark animate-fade-up">{dict.home.eyebrow}</p>
            <h1 className="display-xl h-display mt-5">
              {lines.map((line, i, arr) => (
                <span key={i} className="-my-[0.06em] block overflow-hidden py-[0.06em]">
                  <span className="block animate-rise" style={{ animationDelay: `${120 + i * 110}ms` }}>
                    {line}{i < arr.length - 1 ? '.' : ''}{i === arr.length - 1 && <span className="text-lichen">_</span>}
                  </span>
                </span>
              ))}
            </h1>
            <p className="mt-6 max-w-xl animate-fade-up text-base text-white/80 [animation-delay:380ms] sm:text-lg">{dict.home.heroText}</p>
            <div className="mt-8 flex animate-fade-up flex-wrap items-center gap-2.5 [animation-delay:500ms]">
              <Link href={`/${locale}/shop`} className="btn-primary btn-lg group">{dict.home.heroCta}<IconArrow width={16} height={16} className="transition-transform duration-200 group-hover:translate-x-0.5" /></Link>
              <Link href={`/${locale}/shop/camping`} className="btn-ghost-light btn-lg">{dict.home.heroSecondary}</Link>
            </div>
            <ul className="mt-8 flex animate-fade-up flex-wrap gap-2 [animation-delay:620ms]">
              {trust.map((n) => <li key={n} className="chip-glass h-7 px-3 text-xs">{n}</li>)}
            </ul>
          </div>
        </div>
        <span aria-hidden="true" className="absolute bottom-24 left-1/2 hidden h-9 w-5 -translate-x-1/2 justify-center rounded-full border border-white/40 pt-1.5 md:flex">
          <span className="h-1.5 w-1 animate-cue rounded-full bg-white/80" />
        </span>
      </section>

      {/* ───── USPs ───── */}
      <section className="container-site pt-2">
        <ul className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
          {dict.home.usp.map((u, i) => {
            const Icon = USP_ICONS[i];
            return (
              <Reveal as="li" key={u.title} delay={i * 70}>
                <div className="flex h-full items-start gap-3 rounded-2xl border border-paper-200/80 bg-white p-3.5 shadow-soft transition duration-300 ease-smooth hover:-translate-y-0.5 hover:shadow-lift sm:p-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-moss/10 text-moss"><Icon width={18} height={18} /></span>
                  <div className="min-w-0"><p className="text-[13px] font-bold leading-snug sm:text-sm">{u.title}</p><p className="mt-0.5 text-xs text-mute">{u.text}</p></div>
                </div>
              </Reveal>
            );
          })}
        </ul>
      </section>

      {/* ───── Categories ───── */}
      <section className="container-site pt-20">
        <Reveal className="flex items-end justify-between gap-4">
          <h2 className="h-section">{dict.home.categoriesTitle}</h2>
          <Link href={`/${locale}/shop`} className="btn-outline btn-xs hidden sm:inline-flex">{dict.home.viewAll}<IconArrow width={13} height={13} /></Link>
        </Reveal>
        <ul className="no-scrollbar -mx-4 mt-7 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-4">
          {categories.map((c, i) => (
            <li key={c.slug} className="w-[62%] shrink-0 snap-start sm:w-[42%] md:w-auto">
              <Reveal delay={(i % 4) * 70} className="h-full">
                <Link href={`/${locale}/shop/${c.slug}`}
                  className="group relative flex aspect-[4/3] flex-col justify-between overflow-hidden rounded-2xl bg-ink p-4 text-white ring-1 ring-inset ring-white/10 transition-shadow duration-500 hover:shadow-float">
                  {c.image && <ProductImage src={c.image} alt="" category={c.slug} sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 56vw" fallback="none" className="transition-transform duration-[900ms] ease-smooth group-hover:scale-[1.07]" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-ink/5 transition-colors duration-500 group-hover:via-ink/35" />
                  <span className="relative grid h-10 w-10 place-items-center rounded-full bg-white/10 text-lichen ring-1 ring-inset ring-white/20 backdrop-blur-sm"><CategoryGlyph slug={c.slug} className="h-6 w-6" /></span>
                  <div className="relative">
                    <p className="text-base font-extrabold uppercase leading-tight tracking-tight">{c.name}</p>
                    <p className="mt-0.5 text-xs text-white/75">{t(dict.catalog.results, { count: c.productCount })}</p>
                  </div>
                  <span aria-hidden="true" className="absolute right-3 top-3 grid h-8 w-8 -translate-x-1 place-items-center rounded-full bg-white text-ink opacity-0 shadow-lift transition duration-300 ease-smooth group-hover:translate-x-0 group-hover:opacity-100 [@media(hover:none)]:translate-x-0 [@media(hover:none)]:opacity-100">
                    <IconArrowUpRight width={15} height={15} />
                  </span>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      {/* ───── Featured ───── */}
      <section className="container-site pt-24">
        <Reveal className="flex items-end justify-between gap-4">
          <div>
            <h2 className="h-section">{dict.home.featuredTitle}</h2>
            <p className="mt-2 text-mute">{dict.home.featuredText}</p>
          </div>
          <Link href={`/${locale}/shop`} className="btn-outline btn-xs hidden sm:inline-flex">{dict.home.viewAll}<IconArrow width={13} height={13} /></Link>
        </Reveal>
        <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-4 lg:grid-cols-4">
          {products.map((p, i) => (
            <Reveal key={p.id} delay={(i % 4) * 80}>
              <ProductCard product={p} locale={locale} dict={dict} />
            </Reveal>
          ))}
        </div>
        <div className="mt-8 flex justify-center sm:hidden">
          <Link href={`/${locale}/shop`} className="btn-outline">{dict.home.viewAll}<IconArrow width={14} height={14} /></Link>
        </div>
      </section>

      {/* ───── Brands ───── */}
      <section className="container-site pt-24">
        <Reveal><h2 className="h-section">{dict.home.brandsTitle}</h2></Reveal>
        <div className="mt-8 grid gap-3 md:grid-cols-2 md:gap-4">
          {([['reactive-outdoor', dict.home.reactive, 'bg-ink text-white', 'topo-light'], ['kilos-gear', dict.home.kilos, 'bg-paper-100 text-ink', 'topo']] as const).map(([slug, b, cls, pattern], i) => (
            <Reveal key={slug} delay={i * 100} from="scale">
              <div className={`shine group relative h-full overflow-hidden rounded-3xl p-7 transition-transform duration-500 ease-smooth hover:-translate-y-1 sm:p-10 ${cls}`}>
                <div className={`absolute inset-0 ${pattern} opacity-60`} />
                {slug === 'reactive-outdoor' && <span aria-hidden="true" className="absolute -right-16 -top-20 h-64 w-64 animate-float rounded-full bg-lichen/20 blur-3xl" />}
                <div className="relative">
                  <p className={slug === 'reactive-outdoor' ? 'eyebrow-dark' : 'eyebrow'}>{b.name}</p>
                  <p className="mt-4 text-3xl font-extrabold uppercase leading-none tracking-tight sm:text-4xl">{b.tagline}</p>
                  <p className="mt-4 max-w-md text-sm opacity-75">{b.text}</p>
                  <Link href={`/${locale}/shop?brand=${slug}`} className={`mt-7 ${slug === 'reactive-outdoor' ? 'btn-ghost-light' : 'btn-dark'}`}>
                    {t(dict.home.shopBrand, { brand: b.name })}<IconArrow width={14} height={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───── Newsletter ───── */}
      <section className="container-site pt-24">
        <Reveal><Newsletter /></Reveal>
      </section>
    </>
  );
}
