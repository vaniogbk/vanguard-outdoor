import en from './dictionaries/en';
import fr from './dictionaries/fr';
import de from './dictionaries/de';
import type { Dictionary } from './dictionaries/en';

export const locales = ['en', 'fr', 'de'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = { en: 'English', fr: 'Français', de: 'Deutsch' };
export const ogLocales: Record<Locale, string> = { en: 'en_GB', fr: 'fr_FR', de: 'de_DE' };
export const intlLocales: Record<Locale, string> = { en: 'en-IE', fr: 'fr-FR', de: 'de-DE' };

const dictionaries: Record<Locale, Dictionary> = { en, fr, de };

export const isLocale = (l: string): l is Locale => (locales as readonly string[]).includes(l);
export const getDictionary = (l: string): Dictionary => dictionaries[isLocale(l) ? l : defaultLocale];

/** "Hello {name}" + { name: 'Ana' } */
export function t(template: string, vars: Record<string, string | number> = {}) {
  return template.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? String(vars[k]) : `{${k}}`));
}

export type { Dictionary };
