'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/providers';
import { money } from '@/lib/format';
import { useAdminApi, STATUS_FR } from '@/components/admin/AdminShell';

type Stats = {
  totals: { orders: number; revenue: number; aov: number; customers: number; products: number };
  last30: { orders: number; revenue: number };
  byStatus: { status: string; n: number }[];
  topProducts: { title: string; qty: number; revenue: number }[];
  daily: { day: string; revenue: number; orders: number }[];
  lowStock: { id: string; sku: string; stock: number; title: string; product_id: string }[];
};

function RevenueBars({ daily, locale }: { daily: Stats['daily']; locale: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...daily.map((d) => d.revenue), 1);
  const H = 160;
  return (
    <div className="relative">
      <div className="flex h-[160px] items-end gap-[2px] border-b border-paper-200" role="img" aria-label="Chiffre d’affaires des 14 derniers jours">
        {daily.map((d, i) => (
          <div key={d.day} className="relative flex h-full flex-1 cursor-default items-end" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <div
              className={`w-full rounded-t-[4px] transition-colors ${hover === i ? 'bg-ink' : 'bg-moss'}`}
              style={{ height: d.revenue ? Math.max(3, (d.revenue / max) * H) : 0 }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-mute">
        <span>{new Date(daily[0]?.day).toLocaleDateString(locale, { day: '2-digit', month: 'short' })}</span>
        <span>{new Date(daily[daily.length - 1]?.day).toLocaleDateString(locale, { day: '2-digit', month: 'short' })}</span>
      </div>
      {hover !== null && (
        <div className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap bg-ink px-2.5 py-1.5 text-xs text-white"
          style={{ left: `${((hover + 0.5) / daily.length) * 100}%` }}>
          <p className="text-white/60">{new Date(daily[hover].day).toLocaleDateString(locale, { weekday: 'short', day: '2-digit', month: 'short' })}</p>
          <p className="font-bold">{money(daily[hover].revenue, locale)} · {daily[hover].orders} cmd</p>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const { locale } = useI18n();
  const adminApi = useAdminApi();
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => { adminApi<Stats>('/stats').then(setStats).catch(() => {}); }, [adminApi]);
  if (!stats) return <p className="text-mute">Chargement…</p>;

  const tiles = [
    { label: 'CA total', value: money(stats.totals.revenue, locale) },
    { label: 'CA 30 jours', value: money(stats.last30.revenue, locale) },
    { label: 'Commandes payées', value: String(stats.totals.orders) },
    { label: 'Panier moyen', value: money(stats.totals.aov, locale) },
    { label: 'Clients', value: String(stats.totals.customers) },
    { label: 'Produits actifs', value: String(stats.totals.products) },
  ];

  return (
    <div className="space-y-10">
      <h1 className="h-display text-3xl">Tableau de bord</h1>
      <div className="grid grid-cols-2 gap-px bg-paper-200 md:grid-cols-3 xl:grid-cols-6">
        {tiles.map((t) => (
          <div key={t.label} className="bg-white p-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-mute">{t.label}</p>
            <p className="mt-2 text-2xl font-extrabold tabular-nums tracking-tight">{t.value}</p>
          </div>
        ))}
      </div>

      <section className="card p-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.16em]">Chiffre d’affaires · 14 jours</h2>
        <div className="mt-8"><RevenueBars daily={stats.daily} locale={locale} /></div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card p-6">
          <h2 className="text-xs font-bold uppercase tracking-[0.16em]">Commandes par statut</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {stats.byStatus.map((s) => (
              <li key={s.status} className="flex justify-between">
                <Link href={`/${locale}/admin/orders?status=${s.status}`} className="hover:text-moss">{STATUS_FR[s.status] || s.status}</Link>
                <span className="font-semibold tabular-nums">{s.n}</span>
              </li>
            ))}
            {!stats.byStatus.length && <li className="text-mute">Aucune commande</li>}
          </ul>
        </section>
        <section className="card p-6">
          <h2 className="text-xs font-bold uppercase tracking-[0.16em]">Meilleures ventes</h2>
          <table className="table mt-2"><tbody>
            {stats.topProducts.map((p) => (
              <tr key={p.title}><td className="!px-0">{p.title}</td><td className="text-right tabular-nums">{p.qty}</td><td className="!pr-0 text-right tabular-nums">{money(p.revenue, locale)}</td></tr>
            ))}
          </tbody></table>
          {!stats.topProducts.length && <p className="mt-4 text-sm text-mute">—</p>}
        </section>
        <section className="card p-6">
          <h2 className="text-xs font-bold uppercase tracking-[0.16em]">Stock faible (≤ 5)</h2>
          <table className="table mt-2"><tbody>
            {stats.lowStock.map((v) => (
              <tr key={v.id}>
                <td className="!px-0"><Link href={`/${locale}/admin/products/${v.product_id}`} className="hover:text-moss">{v.title}</Link><p className="text-xs text-mute">{v.sku}</p></td>
                <td className={`!pr-0 text-right font-bold tabular-nums ${v.stock <= 0 ? 'text-signal' : ''}`}>{v.stock}</td>
              </tr>
            ))}
          </tbody></table>
          {!stats.lowStock.length && <p className="mt-4 text-sm text-mute">Tout est en stock.</p>}
        </section>
      </div>
    </div>
  );
}
