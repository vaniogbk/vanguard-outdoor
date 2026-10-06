'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/providers';
import { IconArrow, IconCheck } from './icons';

export function Newsletter() {
  const { dict, locale } = useI18n();
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  return (
    <div className="relative isolate overflow-hidden rounded-3xl bg-ink px-6 py-10 text-white sm:px-12 sm:py-12 lg:flex lg:items-center lg:justify-between lg:gap-10">
      {/* decorative blobs move with transform only (compositor), so they cost no layout or paint work */}
      <span aria-hidden="true" className="pointer-events-none absolute -left-16 -top-24 -z-10 h-72 w-72 animate-float rounded-full bg-lichen/25 blur-3xl" />
      <span aria-hidden="true" className="pointer-events-none absolute -bottom-28 right-0 -z-10 h-80 w-80 animate-float rounded-full bg-signal/25 blur-3xl [animation-delay:-3s]" />
      <div aria-hidden="true" className="topo-light pointer-events-none absolute inset-0 -z-10 opacity-60" />
      <div className="max-w-xl">
        <h2 className="text-2xl font-extrabold uppercase tracking-tight sm:text-3xl">{dict.home.newsletterTitle}</h2>
        <p className="mt-2 text-white/80">{dict.home.newsletterText}</p>
      </div>
      {state === 'done' ? (
        <p className="mt-6 flex animate-fade-up items-center gap-3 text-lg font-bold lg:mt-0" role="status">
          <span className="grid h-9 w-9 animate-pop place-items-center rounded-full bg-lichen text-ink"><IconCheck width={18} height={18} /></span>
          {dict.home.newsletterThanks}
        </p>
      ) : (
        <form
          className="mt-6 w-full max-w-md lg:mt-0"
          onSubmit={async (e) => {
            e.preventDefault();
            setState('loading');
            try { await api('/api/newsletter', { json: { email, locale } }); setState('done'); } catch { setState('error'); }
          }}
        >
          <div className="flex items-center gap-1.5 rounded-full bg-white p-1.5 shadow-float transition-shadow focus-within:ring-4 focus-within:ring-lichen/40">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={dict.home.newsletterPlaceholder}
              aria-label={dict.home.newsletterPlaceholder} className="h-9 min-w-0 flex-1 rounded-full border-0 bg-transparent px-4 text-sm text-ink outline-none placeholder:text-mute/70" />
            <button disabled={state === 'loading'} className="btn-primary group shrink-0">
              {dict.home.newsletterCta}<IconArrow width={14} height={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
          </div>
          {state === 'error' && <p className="mt-2 pl-4 text-sm text-white/90" role="alert">{dict.common.error}</p>}
        </form>
      )}
    </div>
  );
}
