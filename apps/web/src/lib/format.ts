import { intlLocales, type Locale } from './i18n';

export function money(cents: number, locale: Locale | string = 'en') {
  return new Intl.NumberFormat(intlLocales[locale as Locale] || 'en-IE', { style: 'currency', currency: 'EUR' }).format((cents || 0) / 100);
}

export function date(value: string | Date, locale: Locale | string = 'en', withTime = false) {
  return new Intl.DateTimeFormat(intlLocales[locale as Locale] || 'en-IE', {
    dateStyle: 'medium',
    ...(withTime ? { timeStyle: 'short' } : {}),
  }).format(new Date(value));
}

export function countryName(code: string, locale: Locale | string = 'en') {
  try {
    return new Intl.DisplayNames([intlLocales[locale as Locale] || 'en'], { type: 'region' }).of(code) || code;
  } catch {
    return code;
  }
}

export const discountPct = (price: number, compare?: number | null) =>
  compare && compare > price ? Math.round((1 - price / compare) * 100) : 0;
