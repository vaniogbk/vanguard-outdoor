/**
 * Payment methods advertised on the storefront. What the shopper can actually pay with is decided in the Adyen Customer Area
 * (the Drop-in only shows enabled methods), so this list is just the shop window: edit it with
 * NEXT_PUBLIC_PAYMENT_BADGES="visa,mastercard,cb,applepay,googlepay,sepa,ideal,bancontact,klarna" (comma separated).
 */
const LABELS: Record<string, string> = {
  visa: 'Visa', mastercard: 'Mastercard', cb: 'CB', applepay: 'Apple Pay', googlepay: 'Google Pay',
  sepa: 'SEPA', ideal: 'iDEAL', bancontact: 'Bancontact', klarna: 'Klarna', paypal: 'PayPal',
};
const DEFAULT = 'visa,mastercard,cb,applepay,googlepay,sepa,ideal,bancontact,klarna';

export const PAYMENT_METHODS = (process.env.NEXT_PUBLIC_PAYMENT_BADGES || DEFAULT)
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter((k) => k in LABELS);

export const hasKlarna = PAYMENT_METHODS.includes('klarna');

export function PaymentBadges({ tone = 'light', className = '' }: { tone?: 'light' | 'dark'; className?: string }) {
  const style = tone === 'dark' ? 'border-white/15 bg-white/5 text-white/80' : 'border-paper-200 bg-white text-ink/75';
  return (
    <ul className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {PAYMENT_METHODS.map((k) => (
        <li key={k} className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none ${style}`}>{LABELS[k]}</li>
      ))}
    </ul>
  );
}
