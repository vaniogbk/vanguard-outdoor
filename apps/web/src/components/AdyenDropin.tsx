'use client';

import { useEffect, useRef, useState } from 'react';
import '@adyen/adyen-web/styles/adyen.css';

export type AdyenSession = {
  type: 'adyen';
  sessionId: string;
  sessionData: string;
  clientKey: string;
  environment: 'test' | 'live';
  amount: { value: number; currency: string };
  countryCode: string;
  locale: string;
};

/** Adyen Drop-in (Web v6, sessions flow): renders cards, SEPA, iDEAL, Bancontact, Klarna… as enabled in the Customer Area */
export function AdyenDropin({ session, onDone }: { session: AdyenSession; onDone: (resultCode: string, sessionResult?: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let dropin: { unmount: () => void } | null = null;
    let cancelled = false;
    (async () => {
      try {
        const { AdyenCheckout, Dropin } = await import('@adyen/adyen-web/auto');
        const checkout = await AdyenCheckout({
          session: { id: session.sessionId, sessionData: session.sessionData },
          clientKey: session.clientKey,
          environment: session.environment,
          amount: session.amount,
          countryCode: session.countryCode,
          locale: session.locale,
          onPaymentCompleted: (result) => onDone(result.resultCode || 'Authorised', (result as { sessionResult?: string }).sessionResult),
          onPaymentFailed: (result) => onDone(result?.resultCode || 'Refused'),
          onError: (err) => setError(err.message),
        });
        if (cancelled || !ref.current) return;
        dropin = new Dropin(checkout, { openFirstPaymentMethod: true }).mount(ref.current);
      } catch (e) {
        setError((e as Error).message);
      }
    })();
    return () => { cancelled = true; dropin?.unmount(); };
  }, [session, onDone]);

  return (
    <div>
      <div ref={ref} />
      {error && <p className="mt-3 text-sm text-signal">{error}</p>}
    </div>
  );
}
