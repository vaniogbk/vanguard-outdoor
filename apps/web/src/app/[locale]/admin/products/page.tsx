'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useI18n } from '@/lib/providers';
import { money } from '@/lib/format';
import type { ProductSummary } from '@/lib/types';
import { ProductImage } from '@/components/ProductImage';
import { useAdminApi } from '@/components/admin/AdminShell';

type Row = ProductSummary & { status: string; totalStock: number; variantCount: number };

export default function AdminProducts() {
  const { locale } = useI18n();
  const adminApi = useAdminApi();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [brand, setBrand] = useState('');
  const [rows, setRows] = useState<Row[] | null>(null);
  const [total, setTotal] = useState(0);
  const [sync, setSync] = useState<{ running: boolean; log?: string }>({ running: false });

  const runSync = async () => {
    if (!confirm('Importer / mettre à jour les catalogues Reactive Outdoor + Kilos Gear ? Les nouveaux produits arrivent en brouillon.')) return;
    setSync({ running: true });
    try {
      const r = await adminApi<{ log: string }>('/catalog/import', { json: { draft: true } });
      setSync({ running: false, log: r.log });
      load();
    } catch (e) {
      setSync({ running: false, log: (e as Error).message });
    }
  };

  const load = useCallback(() => {
    const qs = new URLSearchParams({ limit: '100' });
    if (q) qs.set('q', q);
    if (status) qs.set('status', status);
    if (brand) qs.set('brand', brand);
    adminApi<{ products: Row[]; pagination: { total: number } }>(`/products?${qs}`).then((r) => { setRows(r.products); setTotal(r.pagination.total); }).catch(() => {});
  }, [adminApi, q, status, brand]);
  useEffect(() => { load(); }, [status, brand]); // eslint-disable-line react-hooks/exhaustive-deps

  const patch = async (id: string, body: Record<string, unknown>) => {
    await adminApi(`/products/${id}`, { method: 'PATCH', json: body });
    load();
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="h-display text-3xl">Produits <span className="text-lg text-mute">({total})</span></h1>
        <div className="flex flex-wrap gap-2">
          <button onClick={runSync} disabled={sync.running} className="btn-outline btn-sm">{sync.running ? 'Synchronisation…' : '⟳ Synchroniser les catalogues'}</button>
          <Link href={`/${locale}/admin/products/new`} className="btn-primary btn-sm">+ Nouveau produit</Link>
        </div>
      </div>
      {sync.log && <pre className="mt-4 max-h-60 overflow-auto whitespace-pre-wrap bg-ink p-4 font-mono text-xs text-white/80">{sync.log}</pre>}
      <div className="mt-6 flex flex-wrap gap-2">
        <form onSubmit={(e) => { e.preventDefault(); load(); }} className="flex w-full gap-2 sm:w-auto">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…" className="input min-w-0 flex-1 sm:w-56 sm:flex-none" />
          <button className="btn-dark">OK</button>
        </form>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input h-10 w-40">
          <option value="">Tous statuts</option><option value="active">Actif</option><option value="draft">Brouillon</option><option value="archived">Archivé</option>
        </select>
        <select value={brand} onChange={(e) => setBrand(e.target.value)} className="input h-10 w-48">
          <option value="">Toutes marques</option><option value="reactive-outdoor">Reactive Outdoor</option><option value="kilos-gear">Kilos Gear</option><option value="vanguard">Vanguard</option>
        </select>
      </div>
      <div className="mt-6 overflow-x-auto">
        <table className="table min-w-[820px]">
          <thead><tr><th>Produit</th><th>Catégorie</th><th>Prix</th><th className="text-right">Stock</th><th>Statut</th><th>Vedette</th></tr></thead>
          <tbody>
            {rows?.map((p) => (
              <tr key={p.id} className="hover:bg-paper-50">
                <td>
                  <Link href={`/${locale}/admin/products/${p.id}`} className="flex items-center gap-3 font-semibold hover:text-moss">
                    <span className="relative h-12 w-10 shrink-0 overflow-hidden bg-paper-100"><ProductImage src={p.image} alt="" category={p.category?.slug} sizes="40px" /></span>
                    <span>{p.title}<span className="block text-xs font-normal text-mute">{p.brandName} · {p.variantCount} variante(s)</span></span>
                  </Link>
                </td>
                <td>{p.category?.name || '—'}</td>
                <td className="tabular-nums">{money(p.priceCents, locale)}{p.maxPriceCents > p.priceCents && <span className="text-mute"> – {money(p.maxPriceCents, locale)}</span>}</td>
                <td className={`text-right font-semibold tabular-nums ${p.totalStock <= 5 ? 'text-signal' : ''}`}>{p.totalStock}</td>
                <td>
                  <select value={p.status} onChange={(e) => patch(p.id, { status: e.target.value })} className="border border-paper-200 bg-white px-2 py-1 text-xs font-semibold">
                    <option value="active">Actif</option><option value="draft">Brouillon</option><option value="archived">Archivé</option>
                  </select>
                </td>
                <td><input type="checkbox" checked={p.featured} onChange={(e) => patch(p.id, { featured: e.target.checked })} className="h-4 w-4 accent-signal" aria-label="Vedette" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
