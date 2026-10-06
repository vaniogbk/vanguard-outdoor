/**
 * Shipping & VAT rules — Europe only.
 * Prices in the catalogue are VAT-inclusive (B2C, EU One-Stop-Shop model).
 * VAT standard rates: review periodically (last reviewed Oct 2026) — they change.
 */

// EU member states with standard VAT rate (%)
export const EU_VAT = {
  AT: 20, BE: 21, BG: 20, HR: 25, CY: 19, CZ: 21, DK: 25, EE: 24, FI: 25.5, FR: 20,
  DE: 19, GR: 24, HU: 27, IE: 23, IT: 22, LV: 21, LT: 21, LU: 17, MT: 18, NL: 21,
  PL: 23, PT: 23, RO: 21, SK: 23, SI: 22, ES: 21, SE: 25,
};

// Non-EU European destinations we ship to (exports: VAT not charged, import duties may apply)
export const NON_EU = ['GB', 'CH', 'NO', 'IS', 'LI', 'MC', 'AD', 'SM'];

export const COUNTRIES = [...Object.keys(EU_VAT), ...NON_EU].sort();

export const ZONES = {
  1: ['FR', 'DE', 'BE', 'NL', 'LU', 'AT', 'MC'],
  2: Object.keys(EU_VAT).filter((c) => !['FR', 'DE', 'BE', 'NL', 'LU', 'AT'].includes(c)).concat(['AD', 'SM']),
  3: ['GB', 'CH', 'NO', 'IS', 'LI'],
};

// Shipping rates in cents, free above threshold
export const SHIPPING_RATES = {
  1: { standard: 590, express: 1490, freeOver: 7900, days: [2, 4], expressDays: [1, 2] },
  2: { standard: 990, express: 1990, freeOver: 9900, days: [3, 6], expressDays: [2, 3] },
  3: { standard: 1990, express: 3490, freeOver: 19900, days: [4, 8], expressDays: [2, 4] },
};

export function zoneFor(country) {
  for (const [zone, list] of Object.entries(ZONES)) if (list.includes(country)) return Number(zone);
  return null;
}

export const isShippable = (country) => zoneFor(country) !== null;

export function shippingOptions(country, subtotalCents) {
  const zone = zoneFor(country);
  if (!zone) return [];
  const r = SHIPPING_RATES[zone];
  return [
    { id: 'standard', priceCents: subtotalCents >= r.freeOver ? 0 : r.standard, days: r.days, freeOverCents: r.freeOver },
    { id: 'express', priceCents: r.express, days: r.expressDays },
  ];
}

export function vatRate(country) {
  return EU_VAT[country] ?? 0; // monaco follows FR VAT
}

/** VAT amount contained in a VAT-inclusive amount */
export function includedVat(amountCents, country) {
  const rate = country === 'MC' ? EU_VAT.FR : vatRate(country);
  if (!rate) return { rate: 0, cents: 0 };
  return { rate, cents: Math.round(amountCents - amountCents / (1 + rate / 100)) };
}

// Carrier tracking URLs (admin picks a carrier + enters tracking number)
export const CARRIERS = {
  dhl: { name: 'DHL', url: (n) => `https://www.dhl.com/global-en/home/tracking.html?tracking-id=${n}` },
  dpd: { name: 'DPD', url: (n) => `https://tracking.dpd.de/status/en_US/parcel/${n}` },
  gls: { name: 'GLS', url: (n) => `https://gls-group.com/track/${n}` },
  ups: { name: 'UPS', url: (n) => `https://www.ups.com/track?tracknum=${n}` },
  colissimo: { name: 'Colissimo', url: (n) => `https://www.laposte.fr/outils/suivre-vos-envois?code=${n}` },
  chronopost: { name: 'Chronopost', url: (n) => `https://www.chronopost.fr/tracking-no-cms/suivi-page?listeNumerosLT=${n}` },
  postnl: { name: 'PostNL', url: (n) => `https://jouw.postnl.nl/track-and-trace/${n}` },
  hermes: { name: 'Hermes / Evri', url: (n) => `https://www.myhermes.de/empfangen/sendungsverfolgung/sendungsinformation/#${n}` },
  bpost: { name: 'bpost', url: (n) => `https://track.bpost.cloud/btr/web/#/search?itemCode=${n}` },
};

export function trackingUrl(carrier, number) {
  const c = CARRIERS[carrier];
  return c && number ? c.url(encodeURIComponent(number)) : null;
}
