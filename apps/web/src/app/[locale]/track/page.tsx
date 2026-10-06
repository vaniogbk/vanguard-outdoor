'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { useI18n } from '@/lib/providers';
import type { Order } from '@/lib/types';
import { OrderDetail } from '@/components/OrderDetail';

function TrackInner() {
  const { dict } = useI18n();
  const params = useSearchParams();
  const [number, setNumber] = useState(params.get('number') || '');
  const [email, setEmail] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (order) return <div className="py-12"><OrderDetail order={order} /></div>;
  return (
    <div className="mx-auto max-w-md py-14 sm:py-20">
      <h1 className="display-lg h-display">{dict.track.title}</h1>
      <p className="mt-3 text-mute">{dict.track.text}</p>
      <form className="card mt-8 animate-fade-up space-y-4 p-5 sm:p-7" onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        setBusy(true);
        try { setOrder((await api<{ order: Order }>('/api/orders/lookup', { json: { number, email } })).order); }
        catch (err) { setError((err as ApiError).message); }
        finally { setBusy(false); }
      }}>
        <div><label className="label" htmlFor="num">{dict.track.number}</label><input id="num" required className="input uppercase" value={number} onChange={(e) => setNumber(e.target.value)} /></div>
        <div><label className="label" htmlFor="em">{dict.account.email}</label><input id="em" type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        {error && <p className="rounded-xl bg-signal-50 px-3 py-2 text-sm font-semibold text-signal-600" role="alert">{error}</p>}
        <button disabled={busy} className="btn-primary btn-lg btn-block">{busy ? dict.common.loading : dict.track.submit}</button>
      </form>
    </div>
  );
}

export default function TrackPage() {
  return <div className="container-site"><Suspense><TrackInner /></Suspense></div>;
}
