'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, use } from 'react';
import { useI18n } from '@/lib/providers';
import { useAdminApi } from '@/components/admin/AdminShell';

type L = 'en' | 'fr' | 'de';
type VariantForm = { id?: string; sku: string; title: string; price: string; compareAt: string; stock: string; weightGrams: string };
type Form = {
  brand: string; categoryId: string; status: string; featured: boolean; slug: string;
  title: Record<L, string>; description: Record<L, string>; highlights: Record<L, string>;
  images: string; tags: string; variants: VariantForm[];
};

const EMPTY: Form = {
  brand: 'vanguard', categoryId: '', status: 'draft', featured: false, slug: '',
  title: { en: '', fr: '', de: '' }, description: { en: '', fr: '', de: '' }, highlights: { en: '', fr: '', de: '' },
  images: '', tags: '', variants: [{ sku: '', title: 'Default', price: '', compareAt: '', stock: '0', weightGrams: '1000' }],
};
const LANGS: L[] = ['en', 'fr', 'de'];
const toEuros = (c?: number | null) => (c == null ? '' : (c / 100).toFixed(2));
const toCents = (s: string) => Math.round(parseFloat(s.replace(',', '.')) * 100);

export default function AdminProductEdit(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const isNew = params.id === 'new';
  const { locale } = useI18n();
  const adminApi = useAdminApi();
  const router = useRouter();
  const [form, setForm] = useState<Form>(EMPTY);
  const [cats, setCats] = useState<{ id: number; slug: string; name: Record<L, string> }[]>([]);
  const [lang, setLang] = useState<L>('fr');
  const [msg, setMsg] = useState<string | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);

  useEffect(() => {
    adminApi<{ categories: typeof cats }>('/categories').then((r) => setCats(r.categories)).catch(() => {});
    if (isNew) return;
    adminApi<{ product: any }>(`/products/${params.id}`).then(({ product: p }) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      setSourceUrl(p.sourceUrl);
      setForm({
        brand: p.brand, categoryId: p.categoryId ? String(p.categoryId) : '', status: p.status, featured: p.featured, slug: p.slug,
        title: { en: '', fr: '', de: '', ...p.titleI18n },
        description: { en: '', fr: '', de: '', ...p.descriptionI18n },
        highlights: Object.fromEntries(LANGS.map((l) => [l, (p.highlightsI18n?.[l] || []).join('\n')])) as Record<L, string>,
        images: (p.images || []).join('\n'),
        tags: (p.tags || []).join(', '),
        variants: p.variants.map((v: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
          id: v.id, sku: v.sku, title: v.title, price: toEuros(v.priceCents), compareAt: toEuros(v.compareAtCents), stock: String(v.stock ?? 0), weightGrams: String(v.weightGrams),
        })),
      });
    }).catch(() => setMsg('Produit introuvable'));
  }, [adminApi, isNew, params.id]);

  const setV = (i: number, patch: Partial<VariantForm>) => setForm((f) => ({ ...f, variants: f.variants.map((v, j) => (j === i ? { ...v, ...patch } : v)) }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const body = {
      brand: form.brand,
      slug: form.slug || undefined,
      categoryId: form.categoryId ? Number(form.categoryId) : null,
      status: form.status,
      featured: form.featured,
      title: form.title,
      description: form.description,
      highlights: Object.fromEntries(LANGS.map((l) => [l, form.highlights[l].split('\n').map((s) => s.trim()).filter(Boolean)])),
      images: form.images.split('\n').map((s) => s.trim()).filter(Boolean),
      tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean),
      variants: form.variants.map((v) => ({
        ...(v.id ? { id: v.id } : {}), sku: v.sku, title: v.title || 'Default', priceCents: toCents(v.price),
        compareAtCents: v.compareAt ? toCents(v.compareAt) : null, stock: Number(v.stock) || 0, weightGrams: Number(v.weightGrams) || 0,
      })),
    };
    try {
      const r = await adminApi<{ product: { id: string } }>(isNew ? '/products' : `/products/${params.id}`, { method: isNew ? 'POST' : 'PUT', json: body });
      setMsg('Enregistré ✔');
      if (isNew) router.replace(`/${locale}/admin/products/${r.product.id}`);
    } catch (err) {
      const e2 = err as Error & { details?: { path: string; message: string }[] };
      setMsg(`${e2.message}${e2.details ? ` — ${e2.details.map((d) => `${d.path}: ${d.message}`).join(', ')}` : ''}`);
    }
  };

  return (
    <form onSubmit={save} className="space-y-8">
      <Link href={`/${locale}/admin/products`} className="text-sm text-mute hover:text-ink">← Produits</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="h-display text-3xl">{isNew ? 'Nouveau produit' : form.title.fr || form.title.en}</h1>
        <div className="flex gap-2">
          {!isNew && <Link href={`/${locale}/product/${form.slug}`} target="_blank" className="btn-outline btn-sm">Voir</Link>}
          <button className="btn-primary btn-sm">Enregistrer</button>
        </div>
      </div>
      {msg && <p className="border-l-4 border-ink bg-paper-50 p-3 text-sm font-semibold">{msg}</p>}
      {sourceUrl && <p className="text-xs text-mute">Source : <a href={sourceUrl} target="_blank" rel="noreferrer" className="underline">{sourceUrl}</a></p>}

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <section className="card space-y-4 p-5">
            <div className="flex gap-1">
              {LANGS.map((l) => (
                <button type="button" key={l} onClick={() => setLang(l)} className={`px-3 py-1.5 text-xs font-bold uppercase ${lang === l ? 'bg-ink text-white' : 'bg-paper-100'}`}>{l}</button>
              ))}
            </div>
            <div>
              <label className="label">Titre ({lang}){lang === 'en' && ' *'}</label>
              <input className="input" required={lang === 'en'} value={form.title[lang]} onChange={(e) => setForm({ ...form, title: { ...form.title, [lang]: e.target.value } })} />
            </div>
            <div>
              <label className="label">Description ({lang})</label>
              <textarea className="input h-40 py-2" value={form.description[lang]} onChange={(e) => setForm({ ...form, description: { ...form.description, [lang]: e.target.value } })} />
            </div>
            <div>
              <label className="label">Points forts ({lang}) — un par ligne</label>
              <textarea className="input h-24 py-2" value={form.highlights[lang]} onChange={(e) => setForm({ ...form, highlights: { ...form.highlights, [lang]: e.target.value } })} />
            </div>
            {!form.title.en && <p className="text-xs text-signal">Le titre anglais est obligatoire (langue de repli).</p>}
          </section>

          <section className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-[0.16em]">Variantes, prix (€ TTC) & stock</h2>
              <button type="button" className="btn-outline btn-sm" onClick={() => setForm({ ...form, variants: [...form.variants, { sku: '', title: '', price: '', compareAt: '', stock: '0', weightGrams: '1000' }] })}>+ Variante</button>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="table min-w-[700px]">
                <thead><tr><th>SKU</th><th>Nom</th><th>Prix</th><th>Prix barré</th><th>Stock</th><th>Poids (g)</th><th /></tr></thead>
                <tbody>
                  {form.variants.map((v, i) => (
                    <tr key={v.id || i}>
                      <td><input required className="input h-9 font-mono text-xs" value={v.sku} onChange={(e) => setV(i, { sku: e.target.value })} /></td>
                      <td><input className="input h-9" value={v.title} onChange={(e) => setV(i, { title: e.target.value })} /></td>
                      <td><input required inputMode="decimal" className="input h-9 w-24" value={v.price} onChange={(e) => setV(i, { price: e.target.value })} /></td>
                      <td><input inputMode="decimal" className="input h-9 w-24" value={v.compareAt} onChange={(e) => setV(i, { compareAt: e.target.value })} /></td>
                      <td><input inputMode="numeric" className="input h-9 w-20" value={v.stock} onChange={(e) => setV(i, { stock: e.target.value })} /></td>
                      <td><input inputMode="numeric" className="input h-9 w-24" value={v.weightGrams} onChange={(e) => setV(i, { weightGrams: e.target.value })} /></td>
                      <td>{form.variants.length > 1 && <button type="button" onClick={() => setForm({ ...form, variants: form.variants.filter((_, j) => j !== i) })} className="text-xs text-signal underline">Suppr.</button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card space-y-2 p-5">
            <label className="label">Images — une URL par ligne (la première est l’image principale)</label>
            <textarea className="input h-28 py-2 font-mono text-xs" value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} />
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card space-y-4 p-5">
            <div>
              <label className="label">Statut</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="active">Actif (visible)</option><option value="draft">Brouillon</option><option value="archived">Archivé</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="accent-signal" />Mettre en avant (accueil)</label>
            <div>
              <label className="label">Marque</label>
              <select className="input" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })}>
                <option value="reactive-outdoor">Reactive Outdoor</option><option value="kilos-gear">Kilos Gear</option><option value="vanguard">Vanguard Outdoor</option>
              </select>
            </div>
            <div>
              <label className="label">Catégorie</label>
              <select className="input" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">—</option>
                {cats.map((c) => <option key={c.id} value={c.id}>{c.name.fr || c.name.en}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Slug (URL)</label>
              <input className="input font-mono text-xs" value={form.slug} placeholder="auto depuis le titre EN" onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </div>
            <div>
              <label className="label">Tags (séparés par des virgules)</label>
              <input className="input" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
            </div>
          </section>
        </aside>
      </div>
    </form>
  );
}
