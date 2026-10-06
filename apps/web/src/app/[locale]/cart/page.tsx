'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useCart, useI18n } from '@/lib/providers';
import { money } from '@/lib/format';
import { t } from '@/lib/i18n';
import type { Quote } from '@/lib/types';
import { ProductImage } from '@/components/ProductImage';
import { FreeShippingBar, QtyControl } from '@/components/CartDrawer';
import { PaymentBadges } from '@/components/PaymentBadges';
import { IconArrow, IconBag, IconLock } from '@/components/icons';

/** Same silhouette as the loaded page: the cart lives in localStorage, so it is only known after hydration — no layout shift */
function CartSkeleton() {
  return (
    <div className="container-site min-h-[60svh] py-12" aria-busy="true">
      <div className="skeleton h-10 w-60" />
      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">{[0, 1].map((i) => <div key={i} className="skeleton h-36 rounded-2xl" />)}</div>
        <div className="skeleton h-72 rounded-2xl" />
      </div>
    </div>
  );
}

export default function CartPage() {
  const { dict, locale } = useI18n();
  const { items, update, remove, ready } = useCart();
  const [quote, setQuote] = useState<Quote | null>(null);

  // re-price against the server so stale prices / stock in localStorage never reach checkout
  useEffect(() => {
    if (!ready || items.length === 0) { setQuote(null); return; }
    const ctrl = new AbortController();
    api<Quote>('/api/checkout/quote', { json: { items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })), locale }, signal: ctrl.signal })
      .then(setQuote).catch(() => {});
    return () => ctrl.abort();
  }, [items, ready, locale]);

  const problem = (variantId: string) => quote?.problems.find((p) => p.variantId === variantId);
  const subtotal = quote?.subtotalCents ?? items.reduce((s, i) => s + i.priceCents * i.quantity, 0);

  if (!ready) return <CartSkeleton />;
  if (items.length === 0) {
    return (
      <div className="container-site flex min-h-[60svh] flex-col items-center justify-center gap-5 py-16 text-center">
        <span className="grid h-16 w-16 animate-scale-in place-items-center rounded-full bg-paper-100 text-ink/60"><IconBag width={28} height={28} /></span>
        <h1 className="display-lg h-display">{dict.cart.title}</h1>
        <p className="text-mute">{dict.cart.empty}</p>
        <Link href={`/${locale}/shop`} className="btn-primary btn-lg">{dict.cart.continue}<IconArrow width={15} height={15} /></Link>
      </div>
    );
  }

  return (
    <div className="container-site py-10 sm:py-12">
      <h1 className="display-lg h-display">{dict.cart.title}</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12">
        <ul className="space-y-3">
          {items.map((i, n) => {
            const pb = problem(i.variantId);
            const line = quote?.lines.find((l) => l.variantId === i.variantId);
            return (
              <li key={i.variantId} style={{ animationDelay: `${n * 60}ms` }} className="card flex animate-fade-up gap-3 p-3 sm:gap-5 sm:p-4">
                <Link href={`/${locale}/product/${i.slug}`} className="relative h-28 w-20 shrink-0 overflow-hidden rounded-xl bg-paper-100 xs:w-24 sm:h-32 sm:w-28">
                  <ProductImage src={i.image} alt={i.title} sizes="112px" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex justify-between gap-4">
                    <div className="min-w-0">
                      <Link href={`/${locale}/product/${i.slug}`} className="font-semibold leading-snug hover:underline">{i.title}</Link>
                      {i.variantTitle && <p className="mt-0.5 text-sm text-mute">{i.variantTitle}</p>}
                      <p className="mt-1 text-sm tabular-nums">{money(line?.unitPriceCents ?? i.priceCents, locale)}</p>
                    </div>
                    <p className="font-bold tabular-nums">{money(line?.lineTotalCents ?? i.priceCents * i.quantity, locale)}</p>
                  </div>
                  {pb && (
                    <p className="text-sm font-semibold text-signal">
                      {pb.reason === 'unavailable' ? dict.cart.unavailable : t(dict.cart.onlyLeft, { n: pb.available ?? 0 })}
                    </p>
                  )}
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <QtyControl value={i.quantity} onChange={(q) => update(i.variantId, q)} label={dict.product.quantity} />
                    <button onClick={() => remove(i.variantId)} className="rounded-full px-2.5 py-1 text-sm text-mute underline-offset-2 transition-colors hover:text-signal hover:underline">{dict.cart.remove}</button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <aside className="card h-fit space-y-5 p-5 lg:sticky lg:top-24">
          <FreeShippingBar subtotal={subtotal} />
          <div className="space-y-2 border-t border-paper-200 pt-5 text-sm">
            <div className="flex justify-between"><span>{dict.cart.subtotal}</span><strong className="tabular-nums">{money(subtotal, locale)}</strong></div>
            <div className="flex justify-between"><span>{dict.cart.shipping}</span><span className="text-mute">{dict.cart.shippingAtCheckout}</span></div>
          </div>
          <p className="text-xs text-mute">{dict.product.vatIncluded}</p>
          <Link href={`/${locale}/checkout`} aria-disabled={Boolean(quote?.problems.length)}
            className={`btn-primary btn-lg btn-block ${quote?.problems.length ? 'pointer-events-none opacity-50' : ''}`}><IconLock width={15} height={15} />{dict.cart.checkout}</Link>
          <Link href={`/${locale}/shop`} className="btn-ghost btn-sm btn-block">{dict.cart.continue}</Link>
          <PaymentBadges className="justify-center" />
        </aside>
      </div>
    </div>
  );
}
