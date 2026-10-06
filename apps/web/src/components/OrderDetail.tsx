'use client';

import type { Order } from '@/lib/types';
import { useI18n } from '@/lib/providers';
import { countryName, date, money } from '@/lib/format';
import { StatusBadge } from './StatusBadge';
import { ProductImage } from './ProductImage';
import { IconArrowUpRight } from './icons';

const STEPS = ['paid', 'processing', 'shipped', 'delivered'] as const;

export function OrderDetail({ order }: { order: Order }) {
  const { dict, locale } = useI18n();
  const reached = STEPS.indexOf(order.status as (typeof STEPS)[number]);
  const a = order.shippingAddress;

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="display-lg h-display">{dict.account.order} {order.number}</h1>
          <p className="mt-1 text-sm text-mute">{date(order.createdAt, locale, true)}</p>
        </div>
        <StatusBadge status={order.status} label={dict.status[order.status]} />
      </div>

      {reached >= 0 && (
        <ol className="grid grid-cols-4 gap-2" aria-label={dict.account.timeline}>
          {STEPS.map((s, i) => (
            <li key={s} className="text-center">
              <div className="h-1.5 overflow-hidden rounded-full bg-paper-200">
                {i <= reached && <div className="h-full origin-left animate-grow rounded-full bg-signal" style={{ animationDelay: `${i * 140}ms` }} />}
              </div>
              <p className={`mt-2 text-[11px] font-bold ${i <= reached ? 'text-ink' : 'text-mute'}`}>{dict.status[s]}</p>
            </li>
          ))}
        </ol>
      )}

      {order.trackingNumber && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-ink p-5 text-white">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/60">{dict.account.tracking}</p>
            <p className="mt-1 font-mono text-lg">{order.carrier?.toUpperCase()} · {order.trackingNumber}</p>
          </div>
          {order.trackingUrl && <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">{dict.account.trackParcel}<IconArrowUpRight width={14} height={14} /></a>}
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <ul className="card divide-y divide-paper-200/70 px-4">
            {order.items.map((i) => (
              <li key={i.id} className="flex items-center gap-4 py-4">
                <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-paper-100"><ProductImage src={i.image} alt={i.title} sizes="64px" /></div>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-semibold">{i.title}</p>
                  {i.variantTitle && <p className="text-mute">{i.variantTitle}</p>}
                  <p className="text-mute tabular-nums">{i.quantity} × {money(i.unitPriceCents, locale)}</p>
                </div>
                <p className="font-semibold tabular-nums">{money(i.lineTotalCents, locale)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1.5 text-sm">
            <div className="flex justify-between"><dt>{dict.cart.subtotal}</dt><dd className="tabular-nums">{money(order.subtotalCents, locale)}</dd></div>
            <div className="flex justify-between"><dt>{dict.cart.shipping}</dt><dd className="tabular-nums">{order.shippingCents ? money(order.shippingCents, locale) : dict.checkout.free}</dd></div>
            <div className="flex justify-between border-t border-paper-200 pt-2 text-base font-bold"><dt>{dict.cart.total}</dt><dd className="tabular-nums">{money(order.totalCents, locale)}</dd></div>
            {order.vatCents > 0 && <div className="flex justify-between text-xs text-mute"><dt>{dict.checkout.vat.replace('{rate}', String(order.vatRate))}</dt><dd className="tabular-nums">{money(order.vatCents, locale)}</dd></div>}
          </dl>
        </div>
        <div className="space-y-8">
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink/70">{dict.account.shippingTo}</h2>
            <address className="mt-3 text-sm not-italic leading-relaxed">
              {a.firstName} {a.lastName}<br />{a.company && <>{a.company}<br /></>}{a.line1}<br />{a.line2 && <>{a.line2}<br /></>}
              {a.postalCode} {a.city}<br />{countryName(a.country, locale)}
            </address>
          </div>
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink/70">{dict.account.timeline}</h2>
            <ol className="mt-3 space-y-3 border-l border-paper-200 pl-4 text-sm">
              {[...order.events].reverse().map((e, i) => (
                <li key={i} className="relative">
                  <span className={`absolute -left-[21px] top-1.5 h-2 w-2 rounded-full ${i === 0 ? 'bg-signal ring-4 ring-signal/15' : 'bg-paper-200'}`} />
                  <p className="font-semibold">{dict.status[e.type as keyof typeof dict.status] || e.message}</p>
                  <p className="text-xs text-mute">{date(e.createdAt, locale, true)}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
