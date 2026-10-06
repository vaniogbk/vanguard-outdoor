'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useI18n } from '@/lib/providers';
import { date, money, countryName } from '@/lib/format';
import type { Order, OrderStatus } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';
import { useAdminApi, STATUS_FR } from '@/components/admin/AdminShell';

function OrdersInner() {
  const { locale } = useI18n();
  const adminApi = useAdminApi();
  const router = useRouter();
  const params = useSearchParams();
  const status = params.get('status') || '';
  const [q, setQ] = useState(params.get('q') || '');
  const [data, setData] = useState<{ orders: Order[]; pagination: { total: number } } | null>(null);

  useEffect(() => {
    const qs = new URLSearchParams();
    if (status) qs.set('status', status);
    if (params.get('q')) qs.set('q', params.get('q')!);
    adminApi<{ orders: Order[]; pagination: { total: number } }>(`/orders?${qs}`).then(setData).catch(() => {});
  }, [adminApi, status, params]);

  const go = (updates: Record<string, string>) => {
    const qs = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(updates)) v ? qs.set(k, v) : qs.delete(k);
    router.push(`/${locale}/admin/orders?${qs}`);
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="h-display text-3xl">Commandes {data && <span className="text-lg text-mute">({data.pagination.total})</span>}</h1>
        <form onSubmit={(e) => { e.preventDefault(); go({ q }); }} className="flex w-full gap-2 sm:w-auto">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="N°, e-mail, nom…" className="input min-w-0 flex-1 sm:w-56 sm:flex-none" />
          <button className="btn-dark">Rechercher</button>
        </form>
      </div>
      <div className="mt-6 flex flex-wrap gap-1.5">
        {['', 'paid', 'processing', 'shipped', 'delivered', 'pending_payment', 'payment_failed', 'cancelled', 'refunded'].map((s) => (
          <button key={s} onClick={() => go({ status: s })} className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${status === s ? 'border-ink bg-ink text-white' : 'border-paper-200 hover:border-ink'}`}>
            {s ? STATUS_FR[s] : 'Toutes'}
          </button>
        ))}
      </div>
      <div className="mt-6 overflow-x-auto">
        <table className="table min-w-[760px]">
          <thead><tr><th>Commande</th><th>Date</th><th>Client</th><th>Pays</th><th>Statut</th><th>Paiement</th><th className="text-right">Total</th></tr></thead>
          <tbody>
            {data?.orders.map((o) => (
              <tr key={o.id} className="cursor-pointer hover:bg-paper-50" onClick={() => router.push(`/${locale}/admin/orders/${o.id}`)}>
                <td className="font-semibold"><Link href={`/${locale}/admin/orders/${o.id}`}>{o.number}</Link><p className="text-xs font-normal text-mute">{o.itemCount} article(s)</p></td>
                <td>{date(o.createdAt, locale, true)}</td>
                <td>{o.shippingAddress.firstName} {o.shippingAddress.lastName}<p className="text-xs text-mute">{o.email}</p></td>
                <td>{countryName(o.shippingAddress.country, locale)}</td>
                <td><StatusBadge status={o.status as OrderStatus} label={STATUS_FR[o.status]} /></td>
                <td className="text-xs uppercase text-mute">{o.paymentProvider}</td>
                <td className="text-right font-bold tabular-nums">{money(o.totalCents, locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && data.orders.length === 0 && <p className="py-10 text-center text-mute">Aucune commande.</p>}
      </div>
    </div>
  );
}

export default function AdminOrders() {
  return <Suspense><OrdersInner /></Suspense>;
}
