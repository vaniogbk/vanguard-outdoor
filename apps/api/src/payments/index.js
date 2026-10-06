import config from '../config.js';
import adyen from './adyen.js';
import payoneer from './payoneer.js';
import mock from './mock.js';

const registry = { adyen, payoneer, mock };

/** Providers enabled through PAYMENT_PROVIDERS and actually configured */
export function enabledProviders() {
  return config.payments.providers
    .map((name) => registry[name])
    .filter((p) => p && p.isConfigured());
}

export function getProvider(name) {
  const list = enabledProviders();
  if (!name) return list[0] || null;
  return list.find((p) => p.name === name) || null;
}

export { registry };
