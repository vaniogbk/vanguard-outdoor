import 'dotenv/config';

const env = process.env;

function required(name, fallback) {
  const v = env[name] ?? fallback;
  if (v === undefined || v === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v;
}

const isProd = env.NODE_ENV === 'production';

/**
 * A weak signing secret (or one copied from the docs) lets anyone forge admin tokens, and it also protects webhooks:
 * in production the API refuses to start with it rather than running exposed.
 */
export function assertStrongSecret(name, value) {
  const weak =
    value.length < 32 ||
    new Set(value).size < 10 ||
    /change[-_]?me|dev-only|ci-secret|your[-_]?secret|placeholder|example|password|^secret/i.test(value);
  if (weak) {
    throw new Error(`${name} must be a random value of at least 32 characters in production (generate one with: openssl rand -hex 48)`);
  }
  return value;
}

const jwtSecret = required('JWT_SECRET', isProd ? undefined : 'dev-only-secret-change-me');
if (isProd) assertStrongSecret('JWT_SECRET', jwtSecret);
if (isProd && env.PAYONEER_NOTIFICATION_SECRET) assertStrongSecret('PAYONEER_NOTIFICATION_SECRET', env.PAYONEER_NOTIFICATION_SECRET);

export const config = {
  env: env.NODE_ENV || 'development',
  isProd,
  port: Number(env.PORT || 4000),
  databaseUrl: required('DATABASE_URL', isProd ? undefined : 'postgresql://vanguard:vanguard@localhost:5432/vanguard'),
  databaseSsl: env.DATABASE_SSL === 'true',
  jwtSecret,
  jwtExpiresIn: env.JWT_EXPIRES_IN || '7d',
  adminJwtExpiresIn: env.ADMIN_JWT_EXPIRES_IN || '12h',
  // Comma-separated list of allowed origins (Vercel prod + preview domains)
  corsOrigins: (env.CORS_ORIGINS || 'http://localhost:3000').split(',').map((s) => s.trim()).filter(Boolean),
  frontendUrl: (env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, ''),
  publicApiUrl: (env.PUBLIC_API_URL || `http://localhost:${env.PORT || 4000}`).replace(/\/$/, ''),
  currency: 'EUR',

  payments: {
    // Comma-separated list, first one is the default: adyen,payoneer,mock
    providers: (env.PAYMENT_PROVIDERS || (isProd ? 'adyen' : 'mock')).split(',').map((s) => s.trim()).filter(Boolean),
    adyen: {
      apiKey: env.ADYEN_API_KEY || '',
      merchantAccount: env.ADYEN_MERCHANT_ACCOUNT || '',
      clientKey: env.ADYEN_CLIENT_KEY || '',
      hmacKey: env.ADYEN_HMAC_KEY || '',
      environment: (env.ADYEN_ENVIRONMENT || 'test').toLowerCase(), // test | live
      // Required for live: e.g. "1797a841fbb37ca7-AdyenDemo" (Customer Area > Developers > API URLs)
      liveEndpointUrlPrefix: env.ADYEN_LIVE_PREFIX || '',
    },
    payoneer: {
      // Payoneer Checkout (OPG) — sandbox: https://api.sandbox.oscato.com, live: https://api.live.oscato.com
      baseUrl: (env.PAYONEER_BASE_URL || 'https://api.sandbox.oscato.com').replace(/\/$/, ''),
      merchantCode: env.PAYONEER_MERCHANT_CODE || '',
      apiToken: env.PAYONEER_API_TOKEN || '',
      division: env.PAYONEER_DIVISION || '',
      // Shared secret placed in the notification URL. Must be its own random value (never derived from JWT_SECRET):
      // Payoneer is not usable until it is set.  openssl rand -hex 24
      notificationSecret: env.PAYONEER_NOTIFICATION_SECRET || '',
    },
  },

  catalog: {
    // FX + margin used by the Shopify importer when a source store is not priced in EUR
    usdToEur: Number(env.FX_USD_EUR || 0.86),
    priceMultiplier: Number(env.PRICE_MULTIPLIER || 1),
  },

  admin: {
    email: env.ADMIN_EMAIL || '',
    password: env.ADMIN_PASSWORD || '',
  },
};

export default config;
