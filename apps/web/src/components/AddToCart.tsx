'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Product } from '@/lib/types';
import { useCart, useI18n } from '@/lib/providers';
import { money, discountPct, countryName } from '@/lib/format';
import { t } from '@/lib/i18n';
import { QtyControl } from './CartDrawer';
import { IconBag, IconCard, IconCheck, IconLock, IconReturn, IconShield, IconTruck } from './icons';
import { PaymentBadges, hasKlarna } from './PaymentBadges';

// Mirrors API shipping zones for the on-page delivery promise (final price computed server-side)
const ZONE1 = ['FR', 'DE', 'BE', 'NL', 'LU', 'AT', 'MC'];
const ZONE3 = ['GB', 'CH', 'NO', 'IS', 'LI'];
const DEFAULT_COUNTRY = { en: 'IE', fr: 'FR', de: 'DE' } as const;

export function AddToCart({ product }: { product: Product }) {
  const { dict, locale } = useI18n();
  const { add } = useCart();
  const firstAvailable = product.variants.find((v) => v.inStock) || product.variants[0];
  const [variantId, setVariantId] = useState(firstAvailable?.id);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [country, setCountry] = useState<string>(DEFAULT_COUNTRY[locale]);
  const [ctaVisible, setCtaVisible] = useState(true);
  const [footerVisible, setFooterVisible] = useState(false);
  const ctaRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const lang = navigator.language?.split('-')[1]?.toUpperCase();
    if (lang && lang.length === 2) setCountry(lang);
  }, []);

  // Mobile buy bar: shown while the main button is out of view, hidden again once the footer is reached
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const observers: IntersectionObserver[] = [];
    if (ctaRef.current) {
      const io = new IntersectionObserver(([e]) => setCtaVisible(e.isIntersecting), { threshold: 0 });
      io.observe(ctaRef.current);
      observers.push(io);
    }
    const footer = document.querySelector('footer');
    if (footer) {
      const io = new IntersectionObserver(([e]) => setFooterVisible(e.isIntersecting), { threshold: 0 });
      io.observe(footer);
      observers.push(io);
    }
    return () => observers.forEach((o) => o.disconnect());
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);

  const variant = useMemo(() => product.variants.find((v) => v.id === variantId) || firstAvailable, [variantId, product.variants, firstAvailable]);
  if (!variant) return null;
  const pct = discountPct(variant.priceCents, variant.compareAtCents);
  const zone = ZONE1.includes(country) ? [2, 4] : ZONE3.includes(country) ? [4, 8] : [3, 6];
  const freeFrom = ZONE1.includes(country) ? 7900 : ZONE3.includes(country) ? 19900 : 9900;
  const multi = product.variants.length > 1;
  const showBar = !ctaVisible && !footerVisible;

  const onAdd = () => {
    add({
      variantId: variant.id,
      slug: product.slug,
      title: product.title,
      variantTitle: variant.title === 'Default' ? null : variant.title,
      image: product.image,
      priceCents: variant.priceCents,
      quantity: qty,
    });
    setAdded(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 2200);
  };

  const label = added
    ? <span key="ok" className="flex animate-fade-up items-center gap-2"><IconCheck className="animate-pop" width={16} height={16} />{dict.product.added}</span>
    : variant.inStock
      ? <span key="add" className="flex items-center gap-2"><IconBag width={16} height={16} />{dict.product.addToCart}</span>
      : <span key="out">{dict.product.soldOut}</span>;

  return (
    <div className="space-y-5">
      <div>
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className={`text-3xl font-extrabold tabular-nums tracking-tight ${pct ? 'text-signal' : ''}`}>{money(variant.priceCents, locale)}</span>
          {pct > 0 && (
            <>
              <s className="text-base text-mute">{money(variant.compareAtCents!, locale)}</s>
              <span className="chip-signal">{t(dict.product.save, { pct })}</span>
            </>
          )}
        </p>
        <p className="mt-1 text-xs text-mute">{dict.product.vatIncluded}</p>
        {hasKlarna && (
          <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-paper-50 px-3 py-1.5 text-xs font-medium text-ink/80 ring-1 ring-inset ring-paper-200">
            <IconCard width={14} height={14} className="text-moss" />{dict.product.flexPay}
          </p>
        )}
      </div>

      {multi && (
        <fieldset>
          <legend className="label">{Object.keys(variant.options || {})[0] || dict.product.option}</legend>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => {
              const on = v.id === variant.id;
              return (
                <button key={v.id} type="button" onClick={() => setVariantId(v.id)} disabled={!v.inStock} aria-pressed={on}
                  className={`rounded-full border px-3.5 py-1.5 text-left text-[13px] font-semibold transition duration-200 ease-smooth active:scale-95 ${on ? 'border-ink bg-ink text-white shadow-soft' : 'border-paper-200 bg-white hover:border-ink/60'} ${!v.inStock ? 'cursor-not-allowed text-mute line-through opacity-50' : ''}`}>
                  {v.title}
                  <span className={`ml-2 text-xs font-medium ${on ? 'text-white/70' : 'text-mute'}`}>{money(v.priceCents, locale)}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <p className={`flex items-center gap-2 text-[13px] font-semibold ${variant.inStock ? 'text-emerald-700' : 'text-signal'}`}>
        <span className="relative flex h-2 w-2">
          {variant.inStock && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/50 [animation-iteration-count:3]" />}
          <span className={`relative h-2 w-2 rounded-full ${variant.inStock ? 'bg-emerald-600' : 'bg-signal'}`} />
        </span>
        {variant.inStock ? dict.product.inStock : dict.product.outOfStock}
      </p>

      <div ref={ctaRef} className="flex items-center gap-2.5">
        <QtyControl size="md" value={qty} onChange={(n) => setQty(Math.max(1, Math.min(20, n)))} label={dict.product.quantity} />
        <button onClick={onAdd} disabled={!variant.inStock} className="btn-primary btn-lg flex-1">{label}</button>
      </div>

      <div className="rounded-2xl border border-paper-200 bg-paper-50/60 p-4 text-sm">
        <p className="flex items-start gap-3"><IconTruck className="mt-0.5 shrink-0 text-moss" width={18} height={18} />
          <span>{t(dict.product.delivery, { country: countryName(country, locale), min: zone[0], max: zone[1] })}<br />
            <span className="text-mute">{t(dict.product.freeDelivery, { amount: money(freeFrom, locale) })}</span></span>
        </p>
      </div>
      <ul className="grid grid-cols-3 gap-2 text-center text-[11px] font-semibold leading-tight text-ink/80">
        <li className="flex flex-col items-center gap-1.5 rounded-xl bg-paper-50 p-2.5"><IconReturn width={17} height={17} className="text-moss" />{dict.product.returns}</li>
        <li className="flex flex-col items-center gap-1.5 rounded-xl bg-paper-50 p-2.5"><IconLock width={17} height={17} className="text-moss" />{dict.product.secure}</li>
        <li className="flex flex-col items-center gap-1.5 rounded-xl bg-paper-50 p-2.5"><IconShield width={17} height={17} className="text-moss" />{dict.product.warranty}</li>
      </ul>
      <PaymentBadges />

      <div aria-hidden={!showBar}
        className={`fixed inset-x-0 bottom-0 z-30 border-t border-paper-200 bg-white/90 backdrop-blur-xl safe-bottom transition-transform duration-300 ease-smooth lg:hidden ${showBar ? 'translate-y-0' : 'pointer-events-none translate-y-full'}`}>
        <div className="mx-auto flex max-w-site items-center gap-3 px-4 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-mute">{product.title}</p>
            <p className="flex items-baseline gap-2">
              <span className={`text-base font-extrabold tabular-nums ${pct ? 'text-signal' : ''}`}>{money(variant.priceCents, locale)}</span>
              {pct > 0 && <s className="text-xs text-mute">{money(variant.compareAtCents!, locale)}</s>}
            </p>
          </div>
          <button onClick={onAdd} disabled={!variant.inStock} tabIndex={showBar ? 0 : -1} className="btn-primary">{label}</button>
        </div>
      </div>
    </div>
  );
}
