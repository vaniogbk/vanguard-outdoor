'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/providers';
import { date, money } from '@/lib/format';
import { useAdminApi } from '@/components/admin/AdminShell';

type Customer = { id: string; email: string; first_name: string; last_name: string; role: string; locale: string; created_at: string; orders: number; spent: number };

export default function AdminCustomers() {
  const { locale } = useI18n();
  const adminApi = useAdminApi();
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<Customer[] | null>(null);
  const load = (query = '') => adminApi<{ customers: Customer[] }>(`/customers${query ? `?q=${encodeURIComponent(query)}` : ''}`).then((r) => setRows(r.customers)).catch(() => {});
  useEffect(() => { load(); }, [adminApi]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="h-display text-3xl">Clients</h1>
        <form onSubmit={(e) => { e.preventDefault(); load(q); }} className="flex w-full gap-2 sm:w-auto">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="E-mail ou nom" className="input min-w-0 flex-1 sm:w-56 sm:flex-none" />
          <button className="btn-dark">Rechercher</button>
        </form>
      </div>
      <div className="mt-6 overflow-x-auto">
        <table className="table min-w-[640px]">
          <thead><tr><th>Client</th><th>Langue</th><th>Inscrit le</th><th className="text-right">Commandes</th><th className="text-right">Dépensé</th></tr></thead>
          <tbody>
            {rows?.map((c) => (
              <tr key={c.id}>
                <td>{c.first_name} {c.last_name} {c.role === 'admin' && <span className="ml-1 bg-signal px-1.5 text-[10px] font-bold uppercase text-white">admin</span>}<p className="text-xs text-mute">{c.email}</p></td>
                <td className="uppercase">{c.locale}</td>
                <td>{date(c.created_at, locale)}</td>
                <td className="text-right tabular-nums">{c.orders}</td>
                <td className="text-right font-semibold tabular-nums">{money(c.spent, locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
