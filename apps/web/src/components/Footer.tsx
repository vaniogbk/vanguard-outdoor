import Link from 'next/link';
import { Suspense } from 'react';
import type { Dictionary, Locale } from '@/lib/i18n';
import type { Category } from '@/lib/types';
import { Logo } from './Logo';
import { LocaleSwitcher } from './LocaleSwitcher';
import { PaymentBadges } from './PaymentBadges';

export function Footer({ dict, locale, categories }: { dict: Dictionary; locale: Locale; categories: Pick<Category, 'slug' | 'name' | 'productCount'>[] }) {
  const year = new Date().getFullYear();
  return (
    <footer className="relative mt-24 overflow-hidden rounded-t-[2rem] bg-ink text-white">
      <div aria-hidden="true" className="aurora pointer-events-none absolute inset-0 opacity-70" />
      <div className="relative mx-auto grid max-w-site gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-5 lg:px-10">
        <div className="lg:col-span-2">
          <Logo inverted />
          <p className="mt-5 max-w-sm text-sm text-white/65">{dict.footer.tagline}</p>
          <Suspense><LocaleSwitcher className="mt-6" /></Suspense>
        </div>
        <div>
          <h2 className="footer-title">{dict.footer.shop}</h2>
          <ul className="footer-list">
            <li><Link href={`/${locale}/shop`}>{dict.nav.all}</Link></li>
            {categories.filter((c) => c.productCount > 0).map((c) => (
              <li key={c.slug}><Link href={`/${locale}/shop/${c.slug}`}>{c.name}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="footer-title">{dict.footer.help}</h2>
          <ul className="footer-list">
            <li><Link href={`/${locale}/track`}>{dict.nav.track}</Link></li>
            <li><Link href={`/${locale}/legal/shipping`}>{dict.footer.shippingInfo}</Link></li>
            <li><Link href={`/${locale}/legal/returns`}>{dict.footer.returns}</Link></li>
            <li><Link href={`/${locale}/account`}>{dict.nav.account}</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="footer-title">{dict.footer.company}</h2>
          <ul className="footer-list">
            <li><Link href={`/${locale}/legal/terms`}>{dict.footer.terms}</Link></li>
            <li><Link href={`/${locale}/legal/privacy`}>{dict.footer.privacy}</Link></li>
            <li><Link href={`/${locale}/legal/imprint`}>{dict.footer.imprint}</Link></li>
          </ul>
        </div>
      </div>
      <div className="relative border-t border-white/10">
        <div className="mx-auto flex max-w-site flex-col gap-4 px-4 py-6 text-xs text-white/50 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="uppercase tracking-wider">{dict.footer.payments}</span>
            <PaymentBadges tone="dark" />
          </div>
          <p>© {year} Vanguard Outdoor. {dict.footer.rights} {dict.footer.disclaimer}</p>
        </div>
      </div>
    </footer>
  );
}
