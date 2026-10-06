'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { useCart, useI18n } from '@/lib/providers';
import { useDialog, usePresence } from '@/lib/useDialog';
import { money } from '@/lib/format';
import { t } from '@/lib/i18n';
import { ProductImage } from './ProductImage';
import { IconBag, IconCheck, IconMinus, IconPlus, IconTruck, IconX } from './icons';

export const FREE_SHIPPING_FROM = 7900; // zone 1 threshold, shown as an incentive (final shipping is computed server-side)

export function FreeShippingBar({ subtotal }: { subtotal: number }) {
  const { dict, locale } = useI18n();
  const unlocked = subtotal >= FREE_SHIPPING_FROM;
  const pct = Math.min(100, Math.round((subtotal / FREE_SHIPPING_FROM) * 100));
  return (
    <div>
      <p className="flex items-center gap-2 text-[13px]">
        <span key={String(unlocked)} className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${unlocked ? 'animate-pop bg-moss text-white' : 'bg-paper-100 text-ink/70'}`}>
          {unlocked ? <IconCheck width={13} height={13} /> : <IconTruck width={14} height={14} />}
        </span>
        {unlocked ? <strong>{dict.cart.freeShippingUnlocked}</strong> : t(dict.cart.freeShippingProgress, { amount: money(FREE_SHIPPING_FROM - subtotal, locale) })}
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper-100" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
        <div className="h-full rounded-full bg-gradient-to-r from-moss to-lichen transition-[width] duration-700 ease-smooth" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function QtyControl({ value, onChange, label = 'Quantity', size = 'sm' }: { value: number; onChange: (n: number) => void; label?: string; size?: 'sm' | 'md' }) {
  const btn = `grid ${size === 'md' ? 'h-8 w-8' : 'h-7 w-7'} place-items-center rounded-full text-ink/80 transition duration-150 hover:bg-ink/5 active:scale-90 disabled:opacity-40`;
  return (
    <div className="inline-flex items-center rounded-full border border-paper-200 bg-white p-0.5" role="group" aria-label={label}>
      <button type="button" className={btn} onClick={() => onChange(value - 1)} aria-label={`${label} −1`}><IconMinus width={13} height={13} /></button>
      <span className="min-w-[1.75rem] text-center text-[13px] font-semibold tabular-nums" aria-live="polite">{value}</span>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= 20} aria-label={`${label} +1`}><IconPlus width={13} height={13} /></button>
    </div>
  );
}

export function CartDrawer() {
  const { items, open, setOpen, update, remove, subtotalCents, count } = useCart();
  const { dict, locale } = useI18n();
  const phase = usePresence(open);
  const ref = useRef<HTMLElement>(null);
  // active once the panel is actually mounted ('open' phase), released as soon as it starts closing
  useDialog(ref, phase === 'open', () => setOpen(false));

  if (phase === 'closed') return null;
  const closing = phase === 'closing';
  return (
    <div className="fixed inset-0 z-50">
      <div className={`absolute inset-0 bg-ink/50 backdrop-blur-[2px] ${closing ? 'animate-fade-out' : 'animate-fade-in'}`} onClick={() => setOpen(false)} />
      <aside ref={ref} role="dialog" aria-modal="true" aria-label={dict.cart.title}
        className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-float sm:rounded-l-3xl ${closing ? 'animate-slide-out-right' : 'animate-slide-in-right'}`}>
        <div className="flex h-14 items-center justify-between border-b border-paper-200 px-5">
          <h2 className="flex items-center gap-2 text-sm font-bold">{dict.cart.title}{count > 0 && <span className="chip-soft">{count}</span>}</h2>
          <button onClick={() => setOpen(false)} className="icon-btn -mr-2" aria-label={dict.nav.close}><IconX /></button>
        </div>
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-paper-100 text-ink/60"><IconBag width={24} height={24} /></span>
            <p className="text-mute">{dict.cart.empty}</p>
            <Link href={`/${locale}/shop`} onClick={() => setOpen(false)} className="btn-primary">{dict.cart.continue}</Link>
          </div>
        ) : (
          <>
            <div className="border-b border-paper-200 px-5 py-3.5"><FreeShippingBar subtotal={subtotalCents} /></div>
            <ul className="flex-1 divide-y divide-paper-200/70 overflow-y-auto px-5">
              {items.map((i, n) => (
                <li key={i.variantId} style={{ animationDelay: `${Math.min(n, 6) * 50 + 120}ms` }} className="flex animate-fade-up gap-3.5 py-4">
                  <Link href={`/${locale}/product/${i.slug}`} onClick={() => setOpen(false)} className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-paper-100">
                    <ProductImage src={i.image} alt={i.title} sizes="80px" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold leading-snug">{i.title}</p>
                        {i.variantTitle && <p className="mt-0.5 text-xs text-mute">{i.variantTitle}</p>}
                      </div>
                      <p className="text-sm font-bold tabular-nums">{money(i.priceCents * i.quantity, locale)}</p>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <QtyControl value={i.quantity} onChange={(q) => update(i.variantId, q)} label={dict.product.quantity} />
                      <button onClick={() => remove(i.variantId)} className="rounded-full px-2 py-1 text-xs text-mute underline-offset-2 transition-colors hover:text-signal hover:underline">{dict.cart.remove}</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="space-y-3 border-t border-paper-200 bg-paper-50/60 p-5 safe-bottom">
              <div className="flex items-baseline justify-between text-sm"><span>{dict.cart.subtotal}</span><strong className="text-base tabular-nums">{money(subtotalCents, locale)}</strong></div>
              <p className="text-xs text-mute">{dict.product.vatIncluded}</p>
              <Link href={`/${locale}/checkout`} onClick={() => setOpen(false)} className="btn-primary btn-lg btn-block">{dict.cart.checkout}</Link>
              <Link href={`/${locale}/cart`} onClick={() => setOpen(false)} className="btn-ghost btn-sm btn-block">{dict.cart.title}</Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
