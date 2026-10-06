'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState, type CSSProperties } from 'react';
import { api } from '@/lib/api';
import { useAuth, useCart, useI18n } from '@/lib/providers';
import { money } from '@/lib/format';
import { t } from '@/lib/i18n';
import type { Order } from '@/lib/types';

// Deterministic confetti (same on every render, nothing random → no hydration mismatch). Plays once; hidden for reduced motion.
const COLORS = ['bg-signal', 'bg-lichen', 'bg-moss', 'bg-ink'];
const PIECES = Array.from({ length: 24 }, (_, i) => ({
  left: 6 + ((i * 37) % 88), dx: ((i * 53) % 140) - 70, rot: 180 + ((i * 71) % 540), delay: (i % 8) * 90, w: 6 + (i % 3) * 3, color: COLORS[i % COLORS.length],
}));
function Confetti() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-8 h-0">
      {PIECES.map((p, i) => (
        <span key={i} className={`confetti-piece absolute top-0 animate-confetti rounded-[2px] ${p.color}`}
          style={{ left: `${p.left}%`, width: p.w, height: p.w * 1.6, animationDelay: `${p.delay}ms`, '--dx': `${p.dx}px`, '--rot': `${p.rot}deg` } as CSSProperties} />
      ))}
    </div>
  );
}

/** Status medallion: the tick / cross draws itself */
function Medallion({ kind }: { kind: 'paid' | 'failed' | 'pending' }) {
  if (kind === 'pending') return <span className="mx-auto block h-16 w-16 animate-spin rounded-full border-4 border-paper-200 border-t-signal" role="status" />;
  const paid = kind === 'paid';
  return (
    <svg viewBox="0 0 52 52" className="mx-auto h-20 w-20 animate-pop" aria-hidden="true">
      <circle cx="26" cy="26" r="25" className={paid ? 'fill-ink' : 'fill-signal'} />
      <path d={paid ? 'M15 27l8 8 15-16' : 'M17 17l18 18M35 17 17 35'} fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="40" strokeDashoffset="40" className="animate-draw" />
    </svg>
  );
}

function ReturnInner() {
  const { dict, locale } = useI18n();
  const { clear } = useCart();
  const { user } = useAuth();
  const params = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [tries, setTries] = useState(0);
  const [lost, setLost] = useState(false); // the link is invalid or the API stays unreachable: stop spinning
  const cleared = useRef(false);

  const number = params.get('order');
  const token = params.get('token');

  useEffect(() => {
    if (!number || !token) return;
    let stop = false;
    const qs = new URLSearchParams({ token });
    for (const k of ['sessionResult', 'redirectResult', 'cancelled']) { const v = params.get(k); if (v) qs.set(k, v); }
    const poll = async (n: number) => {
      try {
        const { order } = await api<{ order: Order }>(`/api/checkout/status/${number}?${qs}`);
        if (stop) return;
        setOrder(order);
        setTries(n);
        // webhook may land a few seconds after the redirect — poll ~40s
        if (order.status === 'pending_payment' && n < 20) setTimeout(() => poll(n + 1), 2000);
      } catch {
        if (stop) return;
        if (n < 5) setTimeout(() => poll(n + 1), 2000);
        else setLost(true);
      }
    };
    poll(0);
    return () => { stop = true; };
  }, [number, token, params]);

  const paid = order && ['paid', 'processing', 'shipped', 'delivered'].includes(order.status);
  const failed = order && ['payment_failed', 'cancelled'].includes(order.status);
  useEffect(() => {
    if (paid && !cleared.current) { cleared.current = true; clear(); }
  }, [paid, clear]);

  if (!order && (lost || !number || !token)) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <h1 className="display-lg h-display">{dict.return.failedTitle}</h1>
        <p className="mt-4 text-mute">{dict.common.error}</p>
        <Link href={`/${locale}/shop`} className="btn-outline btn-lg mt-8">{dict.return.continue}</Link>
      </div>
    );
  }
  if (!order || (order.status === 'pending_payment' && tries < 3)) {
    return (
      <div className="flex flex-col items-center gap-5 py-24 text-center" role="status">
        <span className="h-10 w-10 animate-spin rounded-full border-2 border-paper-200 border-t-signal" />
        <p className="font-semibold">{dict.return.checking}</p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-2xl py-16 text-center">
      {paid && <Confetti />}
      <Medallion kind={paid ? 'paid' : failed ? 'failed' : 'pending'} />
      <h1 className="display-lg h-display mt-8 animate-fade-up [animation-delay:200ms]">
        {paid ? dict.return.successTitle : failed ? dict.return.failedTitle : dict.return.pendingTitle}
      </h1>
      <p className="mt-4 animate-fade-up text-mute [animation-delay:300ms]">
        {paid ? t(dict.return.successText, { number: order.number, email: order.email }) : failed ? dict.return.failedText : dict.return.pendingText}
      </p>

      {paid && (
        <div className="card mx-auto mt-10 max-w-md animate-fade-up p-5 text-left text-sm [animation-delay:400ms]">
          <ul className="space-y-2">
            {order.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-4"><span>{i.quantity} × {i.title}{i.variantTitle ? ` — ${i.variantTitle}` : ''}</span><span className="tabular-nums">{money(i.lineTotalCents, locale)}</span></li>
            ))}
          </ul>
          <p className="mt-4 flex justify-between border-t border-paper-200 pt-4 font-bold"><span>{dict.cart.total}</span><span className="tabular-nums">{money(order.totalCents, locale)}</span></p>
        </div>
      )}

      <div className="mt-10 flex flex-wrap justify-center gap-2.5 animate-fade-up [animation-delay:500ms]">
        {failed && <Link href={`/${locale}/checkout`} className="btn-primary btn-lg">{dict.return.retry}</Link>}
        {paid && user && <Link href={`/${locale}/account/orders/${order.number}`} className="btn-dark btn-lg">{dict.return.viewOrder}</Link>}
        {paid && !user && <Link href={`/${locale}/track?number=${order.number}`} className="btn-dark btn-lg">{dict.nav.track}</Link>}
        <Link href={`/${locale}/shop`} className="btn-outline btn-lg">{dict.return.continue}</Link>
      </div>
    </div>
  );
}

export default function ReturnPage() {
  return (
    <div className="container-site">
      <Suspense><ReturnInner /></Suspense>
    </div>
  );
}
