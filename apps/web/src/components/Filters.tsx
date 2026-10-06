'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { useI18n } from '@/lib/providers';
import { useDialog, usePresence } from '@/lib/useDialog';
import { IconChevronDown, IconFilter, IconX } from './icons';

type Opt = { slug: string; name: string; count: number };

function useParamsUpdater() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const set = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(params?.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === '') next.delete(k);
      else next.set(k, v);
    }
    next.delete('page');
    start(() => router.push(`${pathname}${next.toString() ? `?${next}` : ''}`, { scroll: false }));
  };
  return { params, set, pending, pathname };
}

export function SortSelect() {
  const { dict } = useI18n();
  const { params, set } = useParamsUpdater();
  return (
    <label className="inline-flex min-w-0 items-center gap-2 text-[13px]">
      <span className="hidden text-mute xs:inline">{dict.catalog.sort}</span>
      <span className="relative inline-flex min-w-0 items-center">
        <select value={params?.get('sort') || 'featured'} onChange={(e) => set({ sort: e.target.value === 'featured' ? null : e.target.value })} aria-label={dict.catalog.sort}
          className="h-9 min-w-0 max-w-full cursor-pointer appearance-none truncate rounded-full border border-paper-200 bg-white pl-4 pr-9 font-semibold outline-none transition hover:border-ink/40 focus:border-signal/50 focus:ring-4 focus:ring-signal/10">
          {Object.entries(dict.catalog.sorts).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <IconChevronDown className="pointer-events-none absolute right-3 text-ink/60" width={14} height={14} />
      </span>
    </label>
  );
}

function Toggle({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
      <span>{children}</span>
      <span className="relative inline-flex h-5 w-9 shrink-0 items-center">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <span className="absolute inset-0 rounded-full bg-paper-200 transition-colors duration-200 peer-checked:bg-moss peer-focus-visible:ring-2 peer-focus-visible:ring-signal peer-focus-visible:ring-offset-2" />
        <span className="absolute left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ease-spring peer-checked:translate-x-4" />
      </span>
    </label>
  );
}

export function Filters({ categories, brands, activeCategory }: { categories: Opt[]; brands: Opt[]; activeCategory?: string }) {
  const { dict, locale } = useI18n();
  const { params, set, pending, pathname } = useParamsUpdater();
  const [open, setOpen] = useState(false);
  const phase = usePresence(open, 260);
  const sheetRef = useRef<HTMLDivElement>(null);
  useDialog(sheetRef, phase === 'open', () => setOpen(false)); // active once the sheet is mounted, released when it starts closing
  const [min, setMin] = useState(params?.get('minPrice') || '');
  const [max, setMax] = useState(params?.get('maxPrice') || '');
  useEffect(() => { setMin(params?.get('minPrice') || ''); setMax(params?.get('maxPrice') || ''); }, [params]);

  const brandSel = (params?.get('brand') || '').split(',').filter(Boolean);
  const toggleBrand = (slug: string) => {
    const next = brandSel.includes(slug) ? brandSel.filter((b) => b !== slug) : [...brandSel, slug];
    set({ brand: next.join(',') || null });
  };
  const activeCount = ['brand', 'minPrice', 'maxPrice', 'inStock', 'onSale', 'q'].filter((k) => params?.get(k)).length;
  const legend = 'mb-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-ink/70';
  const pill = 'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition duration-200 ease-smooth active:scale-95';

  const panel = (
    <div className={`space-y-7 transition-opacity ${pending ? 'opacity-60' : ''}`}>
      <fieldset>
        <legend className={legend}>{dict.catalog.category}</legend>
        <ul className="flex flex-wrap gap-1.5">
          <li>
            <Link href={`/${locale}/shop${params?.toString() ? `?${params}` : ''}`} scroll={false}
              className={`${pill} ${!activeCategory ? 'border-ink bg-ink text-white' : 'border-paper-200 bg-white hover:border-ink/50'}`}>{dict.nav.all}</Link>
          </li>
          {categories.map((c) => (
            <li key={c.slug}>
              <Link href={`/${locale}/shop/${c.slug}${params?.toString() ? `?${params}` : ''}`} scroll={false}
                className={`${pill} ${activeCategory === c.slug ? 'border-ink bg-ink text-white' : 'border-paper-200 bg-white hover:border-ink/50'}`}>
                {c.name}<span className={`text-[11px] ${activeCategory === c.slug ? 'text-white/70' : 'text-mute'}`}>{c.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      </fieldset>

      <fieldset>
        <legend className={legend}>{dict.catalog.brand}</legend>
        <div className="flex flex-wrap gap-1.5">
          {brands.map((b) => (
            <label key={b.slug} className={`group ${pill} cursor-pointer border-paper-200 bg-white has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-white has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-signal has-[:focus-visible]:ring-offset-2`}>
              <input type="checkbox" className="sr-only" checked={brandSel.includes(b.slug)} onChange={() => toggleBrand(b.slug)} />
              {b.name}<span className="text-[11px] text-mute group-has-[:checked]:text-white/75">{b.count}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={legend}>{dict.catalog.price}</legend>
        <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); set({ minPrice: min || null, maxPrice: max || null }); }}>
          <input inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value.replace(/[^\d]/g, ''))} placeholder={dict.catalog.min} aria-label={dict.catalog.min} className="input h-9 rounded-full px-3.5 text-[13px]" />
          <span className="text-mute" aria-hidden="true">–</span>
          <input inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value.replace(/[^\d]/g, ''))} placeholder={dict.catalog.max} aria-label={dict.catalog.max} className="input h-9 rounded-full px-3.5 text-[13px]" />
          <button className="btn-dark btn-sm shrink-0 px-3" aria-label="OK">OK</button>
        </form>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {[[0, 50], [50, 100], [100, 250], [250, null]].map(([a, b]) => {
            const active = (params?.get('minPrice') || '') === (a ? String(a) : '') && (params?.get('maxPrice') || '') === (b ? String(b) : '');
            return (
              <button key={`${a}-${b}`} type="button" onClick={() => set({ minPrice: a ? String(a) : null, maxPrice: b ? String(b) : null })}
                className={`${pill} !py-1 text-xs ${active ? 'border-ink bg-ink text-white' : 'border-paper-200 bg-white hover:border-ink/50'}`}>
                {b ? `${a}–${b} €` : `${a} €+`}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className={legend}>{dict.catalog.availability}</legend>
        <Toggle checked={params?.get('inStock') === 'true'} onChange={(v) => set({ inStock: v ? 'true' : null })}>{dict.catalog.inStock}</Toggle>
        <Toggle checked={params?.get('onSale') === 'true'} onChange={(v) => set({ onSale: v ? 'true' : null })}>{dict.catalog.onSale}</Toggle>
      </fieldset>

      {activeCount > 0 && (
        <Link href={pathname || `/${locale}/shop`} scroll={false} className="btn-soft btn-sm">{dict.catalog.clear}</Link>
      )}
    </div>
  );

  const closing = phase === 'closing';
  return (
    <>
      <div className="flex items-center justify-between gap-2 lg:hidden">
        <button onClick={() => setOpen(true)} className="btn-outline shrink-0" aria-haspopup="dialog">
          <IconFilter width={15} height={15} />{dict.catalog.filters}{activeCount > 0 && <span className="chip-ink -mr-1.5 h-5 min-w-5 justify-center px-1.5">{activeCount}</span>}
        </button>
        <SortSelect />
      </div>
      <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">{panel}</aside>
      {phase !== 'closed' && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className={`absolute inset-0 bg-ink/50 backdrop-blur-[2px] ${closing ? 'animate-fade-out' : 'animate-fade-in'}`} onClick={() => setOpen(false)} />
          <div ref={sheetRef} role="dialog" aria-modal="true" aria-label={dict.catalog.filters}
            className={`absolute inset-x-0 bottom-0 flex max-h-[86svh] flex-col rounded-t-3xl bg-white shadow-float ${closing ? 'animate-sheet-down' : 'animate-sheet-up'}`}>
            <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-paper-200" aria-hidden="true" />
            <div className="flex h-12 items-center justify-between px-5">
              <h2 className="text-sm font-bold">{dict.catalog.filters}</h2>
              <button onClick={() => setOpen(false)} className="icon-btn -mr-2" aria-label={dict.nav.close}><IconX /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-4 pt-1">{panel}</div>
            <div className="border-t border-paper-200 p-4 safe-bottom"><button onClick={() => setOpen(false)} className="btn-primary btn-lg btn-block">{dict.catalog.apply}</button></div>
          </div>
        </div>
      )}
    </>
  );
}
