'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { useAuth, useCart, useI18n } from '@/lib/providers';
import { countryName, money } from '@/lib/format';
import { t } from '@/lib/i18n';
import type { Address, Quote } from '@/lib/types';
import { ProductImage } from '@/components/ProductImage';
import { PaymentBadges, hasKlarna } from '@/components/PaymentBadges';
import { IconLock } from '@/components/icons';
import type { AdyenSession } from '@/components/AdyenDropin';

const AdyenDropin = dynamic(() => import('@/components/AdyenDropin').then((m) => m.AdyenDropin), { ssr: false });

type Config = { countries: string[]; providers: { name: string; label: string }[] };
type Payment = AdyenSession | { type: 'redirect'; url: string } | { type: 'mock' };
const DEFAULT_COUNTRY = { en: 'IE', fr: 'FR', de: 'DE' } as const;

const Step = ({ n, title }: { n: number; title: string }) => (
  <h2 className="flex items-center gap-3 text-base font-extrabold tracking-tight">
    <span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-xs font-bold text-white">{n}</span>{title}
  </h2>
);

export default function CheckoutPage() {
  const { dict, locale } = useI18n();
  const { items, ready } = useCart();
  const { user, token } = useAuth();
  const router = useRouter();

  const [config, setConfig] = useState<Config | null>(null);
  const [email, setEmail] = useState('');
  const [addr, setAddr] = useState<Address>({ firstName: '', lastName: '', company: '', line1: '', line2: '', postalCode: '', city: '', country: DEFAULT_COUNTRY[locale], phone: '' });
  const [method, setMethod] = useState<'standard' | 'express'>('standard');
  const [provider, setProvider] = useState<string>('');
  const [terms, setTerms] = useState(false);
  const [saveAddress, setSaveAddress] = useState(true);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<{ number: string; accessToken: string } | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);

  useEffect(() => {
    api<Config>('/api/checkout/config').then((c) => { setConfig(c); setProvider(c.providers[0]?.name || ''); }).catch(() => setError(dict.checkout.errorGeneric));
  }, [dict.checkout.errorGeneric]);

  useEffect(() => {
    if (!user) return;
    setEmail((e) => e || user.email);
    if (user.defaultAddress) setAddr((a) => (a.line1 ? a : { ...a, ...user.defaultAddress! }));
    else setAddr((a) => ({ ...a, firstName: a.firstName || user.firstName, lastName: a.lastName || user.lastName }));
  }, [user]);

  const cartItems = useMemo(() => items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })), [items]);
  useEffect(() => {
    if (!ready || cartItems.length === 0) return;
    const ctrl = new AbortController();
    api<Quote>('/api/checkout/quote', { json: { items: cartItems, country: addr.country, shippingMethod: method, locale }, signal: ctrl.signal })
      .then(setQuote).catch(() => {});
    return () => ctrl.abort();
  }, [cartItems, addr.country, method, locale, ready]);

  const countries = useMemo(
    () => (config?.countries || []).map((c) => ({ code: c, name: countryName(c, locale) })).sort((a, b) => a.name.localeCompare(b.name, locale)),
    [config, locale],
  );

  const goToReturn = useCallback((resultCode?: string, sessionResult?: string) => {
    if (!order) return;
    const qs = new URLSearchParams({ order: order.number, token: order.accessToken });
    if (resultCode) qs.set('resultCode', resultCode);
    if (sessionResult) qs.set('sessionResult', sessionResult);
    router.push(`/${locale}/checkout/return?${qs}`);
  }, [order, locale, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await api<{ order: { number: string; accessToken: string }; payment: Payment }>('/api/checkout', {
        token,
        json: { items: cartItems, email, shippingAddress: addr, shippingMethod: method, locale, provider, acceptTerms: terms, saveAddress: Boolean(user && saveAddress) },
      });
      setOrder(res.order);
      if (res.payment.type === 'redirect') { window.location.href = res.payment.url; return; }
      setPayment(res.payment);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const e2 = err as ApiError;
      setError(e2.status === 409 ? dict.cart.unavailable : e2.message || dict.checkout.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  };

  const simulate = async (outcome: 'success' | 'failure') => {
    if (!order) return;
    await api(`/api/checkout/mock/${order.number}/pay`, { json: { token: order.accessToken, outcome } });
    goToReturn(outcome === 'success' ? 'Authorised' : 'Refused');
  };

  if (ready && items.length === 0 && !order) {
    return (
      <div className="container-site flex flex-col items-center gap-6 py-32 text-center">
        <p className="text-mute">{dict.cart.empty}</p>
        <Link href={`/${locale}/shop`} className="btn-primary btn-lg">{dict.cart.continue}</Link>
      </div>
    );
  }

  const field = (key: keyof Address, label: string, opts: { required?: boolean; autoComplete?: string; type?: string; className?: string } = {}) => (
    <div className={opts.className}>
      <label className="label" htmlFor={key}>{label}</label>
      <input id={key} className="input" required={opts.required !== false} autoComplete={opts.autoComplete} type={opts.type || 'text'}
        value={(addr[key] as string) || ''} onChange={(e) => setAddr({ ...addr, [key]: e.target.value })} disabled={Boolean(payment)} />
    </div>
  );
  const optionCard = 'flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-paper-200 bg-white p-3.5 transition duration-200 ease-smooth hover:border-ink/40 has-[:checked]:border-ink has-[:checked]:bg-paper-50 has-[:checked]:shadow-soft has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-signal has-[:focus-visible]:ring-offset-2';

  return (
    <div className="container-site py-8 sm:py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="display-lg h-display">{dict.checkout.title}</h1>
        <p className="chip-soft hidden h-8 gap-1.5 px-3 text-xs sm:inline-flex"><IconLock width={14} height={14} />{dict.product.secure}</p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-12">
        {payment ? (
          <section className="card animate-fade-up space-y-5 p-5 sm:p-6">
            <h2 className="text-lg font-extrabold tracking-tight">{dict.checkout.completePayment}</h2>
            <p className="chip-soft">{order?.number}</p>
            {payment.type === 'adyen' && <AdyenDropin session={payment} onDone={goToReturn} />}
            {payment.type === 'mock' && (
              <div className="rounded-2xl border-2 border-dashed border-ink/60 p-5">
                <p className="font-bold">{dict.checkout.mockTitle}</p>
                <p className="mt-1 text-sm text-mute">{dict.checkout.mockText}</p>
                <div className="mt-5 flex flex-wrap gap-2.5">
                  <button onClick={() => simulate('success')} className="btn-primary">{dict.checkout.mockSuccess}</button>
                  <button onClick={() => simulate('failure')} className="btn-outline">{dict.checkout.mockFailure}</button>
                </div>
              </div>
            )}
          </section>
        ) : (
          <form onSubmit={submit} className="space-y-4" id="checkout-form">
            <section className="card p-5 sm:p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Step n={1} title={dict.checkout.contact} />
                {!user && <p className="text-sm">{dict.checkout.haveAccount} <Link href={`/${locale}/account?next=checkout`} className="font-semibold underline underline-offset-2">{dict.checkout.login}</Link></p>}
              </div>
              <div className="mt-4">
                <label className="label" htmlFor="email">{dict.checkout.email}</label>
                <input id="email" type="email" required autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </section>

            <section className="card p-5 sm:p-6">
              <Step n={2} title={dict.checkout.shippingAddress} />
              <p className="mt-1.5 text-sm text-mute">{dict.checkout.europeOnly}</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {field('firstName', dict.checkout.firstName, { autoComplete: 'given-name' })}
                {field('lastName', dict.checkout.lastName, { autoComplete: 'family-name' })}
                {field('company', dict.checkout.company, { required: false, autoComplete: 'organization', className: 'sm:col-span-2' })}
                {field('line1', dict.checkout.line1, { autoComplete: 'address-line1', className: 'sm:col-span-2' })}
                {field('line2', dict.checkout.line2, { required: false, autoComplete: 'address-line2', className: 'sm:col-span-2' })}
                {field('postalCode', dict.checkout.postalCode, { autoComplete: 'postal-code' })}
                {field('city', dict.checkout.city, { autoComplete: 'address-level2' })}
                <div>
                  <label className="label" htmlFor="country">{dict.checkout.country}</label>
                  <select id="country" className="input" value={addr.country} autoComplete="country" onChange={(e) => setAddr({ ...addr, country: e.target.value })}>
                    {countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                  </select>
                </div>
                {field('phone', dict.checkout.phone, { required: false, autoComplete: 'tel', type: 'tel' })}
              </div>
              {user && (
                <label className="mt-4 flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="h-4 w-4 accent-signal" />{dict.checkout.saveAddress}
                </label>
              )}
            </section>

            <section className="card p-5 sm:p-6">
              <Step n={3} title={dict.checkout.shippingMethod} />
              <div className="mt-4 space-y-2">
                {!quote && [0, 1].map((i) => <div key={i} className="skeleton h-[4.25rem] rounded-xl" />)}
                {(quote?.shippingOptions || []).map((o) => (
                  <label key={o.id} className={optionCard}>
                    <span className="flex items-center gap-3">
                      <input type="radio" name="method" checked={method === o.id} onChange={() => setMethod(o.id)} className="h-4 w-4 accent-signal" />
                      <span>
                        <span className="block font-semibold">{o.id === 'express' ? dict.checkout.express : dict.checkout.standard}</span>
                        <span className="text-sm text-mute">{t(dict.checkout.days, { min: o.days[0], max: o.days[1] })}</span>
                      </span>
                    </span>
                    <span className="font-bold tabular-nums">{o.priceCents === 0 ? dict.checkout.free : money(o.priceCents, locale)}</span>
                  </label>
                ))}
              </div>
            </section>

            <section className="card p-5 sm:p-6">
              <Step n={4} title={dict.checkout.payment} />
              <p className="mt-1.5 text-sm text-mute">{dict.checkout.paymentHint}</p>
              <PaymentBadges className="mt-3" />
              {hasKlarna && <p className="mt-3 rounded-xl bg-paper-50 p-3 text-[13px] leading-relaxed text-ink/80 ring-1 ring-inset ring-paper-200">{dict.checkout.klarnaNote}</p>}
              {config && config.providers.length > 1 && (
                <div className="mt-4 space-y-2">
                  {config.providers.map((p) => (
                    <label key={p.name} className={optionCard}>
                      <span className="flex items-center gap-3">
                        <input type="radio" name="provider" checked={provider === p.name} onChange={() => setProvider(p.name)} className="h-4 w-4 accent-signal" />
                        <span className="font-semibold">{p.label}</span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
              <label className="mt-5 flex items-start gap-2.5 text-sm">
                <input type="checkbox" required checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-0.5 h-4 w-4 accent-signal" />
                <span>{dict.checkout.terms} (<Link href={`/${locale}/legal/terms`} className="underline underline-offset-2" target="_blank">CGV</Link> · <Link href={`/${locale}/legal/privacy`} className="underline underline-offset-2" target="_blank">Privacy</Link>)</span>
              </label>
            </section>

            {error && <p className="rounded-xl border-l-4 border-signal bg-signal-50 p-3 text-sm font-semibold text-signal-600" role="alert">{error}</p>}
            <button type="submit" disabled={submitting || !quote || Boolean(quote?.problems.length) || !config?.providers.length} className="btn-primary btn-lg btn-block">
              <IconLock width={16} height={16} />
              {submitting ? dict.checkout.processing : t(dict.checkout.pay, { amount: money(quote?.totalCents || 0, locale) })}
            </button>
            <Link href={`/${locale}/cart`} className="btn-ghost btn-sm btn-block">{dict.checkout.back}</Link>
          </form>
        )}

        <aside className="card h-fit p-5 lg:sticky lg:top-24">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink/70">{dict.checkout.summary}</h2>
          <ul className="mt-5 space-y-4">
            {items.map((i) => {
              const line = quote?.lines.find((l) => l.variantId === i.variantId);
              return (
                <li key={i.variantId} className="flex gap-3">
                  <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-paper-100">
                    <ProductImage src={i.image} alt={i.title} sizes="56px" />
                    <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-bl-lg bg-ink px-1 text-[10px] font-bold text-white">{i.quantity}</span>
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-semibold leading-snug">{i.title}</p>
                    {i.variantTitle && <p className="text-xs text-mute">{i.variantTitle}</p>}
                  </div>
                  <p className="text-sm font-semibold tabular-nums">{money(line?.lineTotalCents ?? i.priceCents * i.quantity, locale)}</p>
                </li>
              );
            })}
          </ul>
          <dl className="mt-6 space-y-2 border-t border-paper-200 pt-5 text-sm">
            <div className="flex justify-between"><dt>{dict.cart.subtotal}</dt><dd className="tabular-nums">{money(quote?.subtotalCents || 0, locale)}</dd></div>
            <div className="flex justify-between"><dt>{dict.cart.shipping}</dt><dd className="tabular-nums">{quote ? (quote.shippingCents === 0 ? dict.checkout.free : money(quote.shippingCents, locale)) : '—'}</dd></div>
            <div className="flex justify-between border-t border-paper-200 pt-3 text-base font-extrabold"><dt>{dict.cart.total}</dt><dd className="tabular-nums">{money(quote?.totalCents || 0, locale)}</dd></div>
            {quote && quote.vatRate > 0 && (
              <div className="flex justify-between text-xs text-mute"><dt>{t(dict.checkout.vat, { rate: quote.vatRate })}</dt><dd className="tabular-nums">{money(quote.vatCents, locale)}</dd></div>
            )}
          </dl>
        </aside>
      </div>
    </div>
  );
}
