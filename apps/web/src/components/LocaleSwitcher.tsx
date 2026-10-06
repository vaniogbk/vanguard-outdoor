'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { locales, localeNames } from '@/lib/i18n';
import { useI18n } from '@/lib/providers';
import { IconChevronDown } from './icons';

export function LocaleSwitcher({ className = '' }: { className?: string }) {
  const { locale, dict } = useI18n();
  const pathname = usePathname() || '/';
  const search = useSearchParams();
  const rest = pathname.replace(/^\/(en|fr|de)(?=\/|$)/, '');
  const qs = search?.toString() ? `?${search.toString()}` : '';
  return (
    <label className={`relative inline-flex items-center text-sm ${className}`}>
      <span className="sr-only">{dict.footer.language}</span>
      <select
        value={locale}
        onChange={(e) => {
          document.cookie = `NEXT_LOCALE=${e.target.value};path=/;max-age=31536000;samesite=lax`;
          window.location.href = `/${e.target.value}${rest}${qs}`;
        }}
        className="h-9 cursor-pointer appearance-none rounded-full border border-white/20 bg-white/5 pl-4 pr-9 text-[13px] font-semibold text-white outline-none transition-colors hover:bg-white/10 focus:border-white"
      >
        {locales.map((l) => (<option key={l} value={l} className="text-ink">{localeNames[l]}</option>))}
      </select>
      <IconChevronDown className="pointer-events-none absolute right-3 text-white/70" width={14} height={14} />
    </label>
  );
}
