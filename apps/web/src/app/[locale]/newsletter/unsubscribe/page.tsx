'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/providers';
import { t } from '@/lib/i18n';
import { IconCheck } from '@/components/icons';

/**
 * Target of the signed link in every marketing e-mail. Nothing happens when the page merely loads (mail scanners and link
 * previews open links automatically and would otherwise unsubscribe everybody): the shopper confirms with one click.
 */
function UnsubscribeInner() {
  const { dict, locale } = useI18n();
  const params = useSearchParams();
  const email = params.get('e') || '';
  const token = params.get('t') || '';
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const valid = email.includes('@') && token.length >= 16;

  const confirm = async () => {
    setState('busy');
    try { await api('/api/newsletter/unsubscribe', { json: { email, token } }); setState('done'); } catch { setState('error'); }
  };

  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <h1 className="display-lg h-display">{dict.newsletter.unsubTitle}</h1>
      <div className="card mt-8 p-6" aria-live="polite">
        {state === 'done' ? (
          <p className="flex items-center justify-center gap-3 font-semibold">
            <span className="grid h-8 w-8 shrink-0 animate-pop place-items-center rounded-full bg-moss text-white"><IconCheck width={16} height={16} /></span>
            {dict.newsletter.unsubDone}
          </p>
        ) : !valid || state === 'error' ? (
          <p className="font-semibold text-signal-600" role="alert">{dict.newsletter.unsubInvalid}</p>
        ) : (
          <>
            <p className="text-mute">{t(dict.newsletter.unsubText, { email })}</p>
            <button onClick={confirm} disabled={state === 'busy'} className="btn-primary btn-lg btn-block mt-5">{state === 'busy' ? dict.common.loading : dict.newsletter.unsubCta}</button>
          </>
        )}
      </div>
      <Link href={`/${locale}`} className="btn-ghost btn-sm mt-6">{dict.common.home}</Link>
    </div>
  );
}

export default function UnsubscribePage() {
  return <div className="container-site"><Suspense><UnsubscribeInner /></Suspense></div>;
}
