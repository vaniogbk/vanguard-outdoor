'use client';

import Link from 'next/link';
import { useEffect, useState, use } from 'react';
import { useI18n } from '@/lib/providers';
import { countryName, date, money } from '@/lib/format';
import type { Order, OrderStatus } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';
import { useAdminApi, STATUS_FR } from '@/components/admin/AdminShell';

export default function AdminOrderDetail(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const { locale } = useI18n();
  const adminApi = useAdminApi();
  const [order, setOrder] = useState<Order | null>(null);
  const [carriers, setCarriers] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({ status: '', carrier: '', trackingNumber: '', note: '', notifyCustomer: true });
  const [msg, setMsg] = useState<string | null>(null);

  const load = () => adminApi<{ order: Order; carriers: { id: string; name: string }[] }>(`/orders/${params.id}`).then((r) => {
    setOrder(r.order);
    setCarriers(r.carriers);
    setForm((f) => ({ ...f, status: r.order.status, carrier: r.order.carrier || '', trackingNumber: r.order.trackingNumber || '', note: '' }));
  });
  useEffect(() => { load().catch(() => {}); }, [params.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!order) return <p className="text-mute">Chargement…</p>;
  const a = order.shippingAddress;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    try {
      const r = await adminApi<{ order: Order }>(`/orders/${order.id}`, {
        method: 'PATCH',
        json: {
          status: form.status !== order.status ? form.status : undefined,
          carrier: form.carrier || null,
          trackingNumber: form.trackingNumber || null,
          note: form.note || undefined,
          notifyCustomer: form.notifyCustomer,
        },
      });
      setOrder(r.order);
      setForm((f) => ({ ...f, status: r.order.status, note: '' }));
      setMsg('Commande mise à jour ✔');
    } catch (err) {
      setMsg((err as Error).message);
    }
  };

  return (
    <div className="space-y-8">
      <Link href={`/${locale}/admin/orders`} className="text-sm text-mute hover:text-ink">← Commandes</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="h-display text-3xl">{order.number}</h1>
          <p className="text-sm text-mute">{date(order.createdAt, locale, true)} · {order.paymentProvider.toUpperCase()} {order.paymentReference ? `· ${order.paymentReference}` : ''}</p>
        </div>
        <StatusBadge status={order.status as OrderStatus} label={STATUS_FR[order.status]} />
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-8">
          <section className="card p-5">
            <table className="table">
              <thead><tr><th>Article</th><th>SKU</th><th className="text-right">Qté</th><th className="text-right">Total</th></tr></thead>
              <tbody>
                {order.items.map((i) => (
                  <tr key={i.id}><td>{i.title}{i.variantTitle && <p className="text-xs text-mute">{i.variantTitle}</p>}</td><td className="font-mono text-xs">{i.sku}</td><td className="text-right">{i.quantity}</td><td className="text-right">{money(i.lineTotalCents, locale)}</td></tr>
                ))}
              </tbody>
            </table>
            <dl className="mt-4 space-y-1 text-sm">
              <div className="flex justify-between"><dt>Sous-total</dt><dd>{money(order.subtotalCents, locale)}</dd></div>
              <div className="flex justify-between"><dt>Livraison ({order.shippingMethod})</dt><dd>{money(order.shippingCents, locale)}</dd></div>
              <div className="flex justify-between font-bold"><dt>Total</dt><dd>{money(order.totalCents, locale)}</dd></div>
              <div className="flex justify-between text-xs text-mute"><dt>dont TVA {order.vatRate}%</dt><dd>{money(order.vatCents, locale)}</dd></div>
            </dl>
          </section>
          <section className="card p-5">
            <h2 className="text-xs font-bold uppercase tracking-[0.16em]">Historique</h2>
            <ol className="mt-4 space-y-2 text-sm">
              {order.events.map((e, i) => (
                <li key={i} className="flex gap-4"><span className="w-40 shrink-0 text-mute">{date(e.createdAt, locale, true)}</span><span><strong>{e.type}</strong> — {e.message}</span></li>
              ))}
            </ol>
            {order.notes && <pre className="mt-4 whitespace-pre-wrap bg-paper-50 p-3 text-xs">{order.notes}</pre>}
          </section>
        </div>

        <div className="space-y-6">
          <section className="card p-5 text-sm">
            <h2 className="text-xs font-bold uppercase tracking-[0.16em]">Client & livraison</h2>
            <p className="mt-3">{order.email}</p>
            <address className="mt-3 not-italic leading-relaxed">
              {a.firstName} {a.lastName}<br />{a.company && <>{a.company}<br /></>}{a.line1}<br />{a.line2 && <>{a.line2}<br /></>}{a.postalCode} {a.city}<br />{countryName(a.country, locale)}<br />{a.phone}
            </address>
          </section>
          <form onSubmit={save} className="card space-y-4 p-5">
            <h2 className="text-xs font-bold uppercase tracking-[0.16em]">Traitement & expédition</h2>
            <div>
              <label className="label">Statut</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {Object.entries(STATUS_FR).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Transporteur</label>
              <select className="input" value={form.carrier} onChange={(e) => setForm({ ...form, carrier: e.target.value })}>
                <option value="">—</option>
                {carriers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">N° de suivi</label>
              <input className="input font-mono" value={form.trackingNumber} onChange={(e) => setForm({ ...form, trackingNumber: e.target.value })} />
              <p className="mt-1 text-xs text-mute">Ajouter un n° de suivi sur une commande payée la passe en « Expédiée ».</p>
            </div>
            <div>
              <label className="label">Note interne</label>
              <textarea className="input h-20 py-2" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.notifyCustomer} onChange={(e) => setForm({ ...form, notifyCustomer: e.target.checked })} className="accent-signal" />Visible dans le suivi client</label>
            <button className="btn-primary w-full">Enregistrer</button>
            {msg && <p className="text-sm font-semibold">{msg}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}
