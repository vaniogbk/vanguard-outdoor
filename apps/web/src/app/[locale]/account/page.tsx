'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { useAuth, useI18n } from '@/lib/providers';
import { date, money } from '@/lib/format';
import { t } from '@/lib/i18n';
import type { Order } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';
import { ProductImage } from '@/components/ProductImage';
import { IconArrow } from '@/components/icons';

function AuthForms() {
  const { dict, locale } = useI18n();
  const { login, register } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === 'login') await login(form.email, form.password);
      else await register({ ...form, locale });
      if (params.get('next') === 'checkout') router.push(`/${locale}/checkout`);
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md py-12 sm:py-16">
      <h1 className="display-lg h-display mb-6 text-center">{dict.account.title}</h1>
      <div className="card animate-fade-up p-5 sm:p-7">
        <div className="grid grid-cols-2 rounded-full bg-paper-100 p-1" role="tablist">
          {(['login', 'register'] as const).map((m) => (
            <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => setMode(m)}
              className={`h-9 rounded-full text-[13px] font-semibold transition duration-300 ease-smooth ${mode === m ? 'bg-white text-ink shadow-soft' : 'text-mute hover:text-ink'}`}>
              {m === 'login' ? dict.account.login : dict.account.register}
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === 'register' && (
            <div className="grid animate-fade-in grid-cols-2 gap-3">
              <div><label className="label" htmlFor="fn">{dict.account.firstName}</label><input id="fn" className="input" autoComplete="given-name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
              <div><label className="label" htmlFor="ln">{dict.account.lastName}</label><input id="ln" className="input" autoComplete="family-name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
            </div>
          )}
          <div><label className="label" htmlFor="em">{dict.account.email}</label><input id="em" type="email" required className="input" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div>
            <label className="label" htmlFor="pw">{dict.account.password}</label>
            <input id="pw" type="password" required minLength={mode === 'register' ? 8 : 1} className="input" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            {mode === 'register' && <p className="mt-1.5 text-xs text-mute">{dict.account.passwordHint}</p>}
          </div>
          {error && <p className="rounded-xl bg-signal-50 px-3 py-2 text-sm font-semibold text-signal-600" role="alert">{error}</p>}
          <button disabled={busy} className="btn-primary btn-lg btn-block">{busy ? dict.common.loading : mode === 'login' ? dict.account.submitLogin : dict.account.submitRegister}</button>
        </form>
      </div>
      <p className="mt-6 text-center text-sm text-mute">{dict.account.guestTrack} <Link href={`/${locale}/track`} className="font-semibold text-ink underline underline-offset-2">{dict.nav.track}</Link></p>
    </div>
  );
}

function Dashboard() {
  const { dict, locale } = useI18n();
  const { user, token, logout } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  useEffect(() => {
    if (token) api<{ orders: Order[] }>('/api/orders', { token }).then((r) => setOrders(r.orders)).catch(() => setOrders([]));
  }, [token]);
  if (!user) return null;
  const name = user.firstName || user.email.split('@')[0];
  return (
    <div className="py-10 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-paper-200 pb-8">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 animate-pop place-items-center rounded-full bg-ink text-xl font-extrabold uppercase text-white">{name.slice(0, 1)}</span>
          <div>
            <p className="eyebrow">{dict.account.title}</p>
            <h1 className="display-lg h-display mt-1.5">{t(dict.account.welcome, { name })}</h1>
            <p className="mt-1 text-sm text-mute">{user.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {user.role === 'admin' && <Link href={`/${locale}/admin`} className="btn-dark btn-sm">{dict.nav.admin}</Link>}
          <button onClick={logout} className="btn-outline btn-sm">{dict.account.logout}</button>
        </div>
      </div>
      <h2 className="mt-10 text-[11px] font-bold uppercase tracking-[0.16em] text-ink/70">{dict.account.orders}</h2>
      {orders === null ? (
        <div className="mt-6 space-y-3" aria-busy="true">{[0, 1].map((i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
      ) : orders.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-paper-200 bg-paper-50/50 p-10 text-center">
          <p className="text-mute">{dict.account.noOrders}</p>
          <Link href={`/${locale}/shop`} className="btn-primary btn-lg mt-5">{dict.cart.continue}<IconArrow width={15} height={15} /></Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {orders.map((o, n) => (
            <li key={o.id} style={{ animationDelay: `${n * 60}ms` }} className="animate-fade-up">
              <Link href={`/${locale}/account/orders/${o.number}`} className="card group flex items-center gap-4 p-3 transition duration-300 ease-smooth hover:-translate-y-0.5 hover:shadow-lift sm:p-4">
                <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-paper-100"><ProductImage src={o.image || null} alt="" sizes="56px" /></div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{o.number}</p>
                  <p className="text-sm text-mute">{date(o.createdAt, locale)} · {t(dict.account.items, { n: o.itemCount || 0 })}</p>
                </div>
                <StatusBadge status={o.status} label={dict.status[o.status]} />
                <p className="hidden w-24 text-right font-bold tabular-nums sm:block">{money(o.totalCents, locale)}</p>
                <IconArrow width={16} height={16} className="hidden shrink-0 text-ink/40 transition-transform duration-200 group-hover:translate-x-0.5 sm:block" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AccountInner() {
  const { user, ready } = useAuth();
  const { dict } = useI18n();
  if (!ready) return <p className="py-24 text-mute">{dict.common.loading}</p>;
  return user ? <Dashboard /> : <AuthForms />;
}

export default function AccountPage() {
  return <div className="container-site"><Suspense><AccountInner /></Suspense></div>;
}
