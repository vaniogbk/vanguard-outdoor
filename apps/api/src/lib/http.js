export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const badRequest = (msg, details) => new HttpError(400, msg, details);
export const unauthorized = (msg = 'Unauthorized') => new HttpError(401, msg);
export const forbidden = (msg = 'Forbidden') => new HttpError(403, msg);
export const notFound = (msg = 'Not found') => new HttpError(404, msg);
export const conflict = (msg) => new HttpError(409, msg);

/** Validate req[part] against a zod schema and return the parsed value */
export function parse(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw badRequest('Validation failed', result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })));
  }
  return result.data;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v) => typeof v === 'string' && UUID.test(v);

/**
 * Integer taken from a query string: truncated and clamped to [min, max]; `fallback` when absent, zero or not a finite
 * number. (Number('1e308'), Number('abc') and Number('-5') used to flow straight into LIMIT / OFFSET and end in a 500.)
 */
export function intParam(value, { min, max, fallback }) {
  if (value === undefined || value === null || value === '') return fallback;
  const n = Math.trunc(Number(value));
  if (!Number.isFinite(n) || n === 0) return fallback;
  return Math.min(Math.max(n, min), max);
}

/** A price in euros typed in a query string → integer cents, or null when it is not a usable amount */
export function eurosToCents(value) {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.min(Math.round(n * 100), 2_000_000_000) : null;
}

// Postgres refusing a value the CLIENT sent (not a uuid, number out of range, negative LIMIT/OFFSET, text too long…)
const PG_CLIENT_INPUT_ERRORS = new Set(['22P02', '22003', '22001', '22007', '22008', '2201W', '2201X']);

export function errorHandler(err, req, res, _next) {
  const badInput = PG_CLIENT_INPUT_ERRORS.has(err.code);
  const status = err.status || err.statusCode || (badInput ? 400 : 500);
  if (status >= 500) console.error(err);
  else if (badInput) console.warn(`[db] request rejected (${err.code}) ${req.method} ${redactUrl(req.originalUrl || req.url)}`);
  res.status(status).json({
    // unexpected errors stay opaque; deliberate HttpErrors (e.g. 502 from a PSP) keep their message
    error: badInput && !err.status ? 'Invalid request parameter' : status >= 500 && !(err instanceof HttpError) ? 'Internal server error' : err.message,
    ...(err.details ? { details: err.details } : {}),
  });
}

const SENSITIVE_PARAMS = /([?&](?:s|t|e|token|key|secret|password|sessionResult|redirectResult)=)[^&#\s]*/gi;

/**
 * Access logs must never contain credentials: order access tokens (?token=), PSP notification secrets (?s=),
 * payment results and e-mail addresses travel in query strings and would otherwise sit in the hosting logs.
 */
export const redactUrl = (url = '') => String(url).replace(SENSITIVE_PARAMS, '$1[redacted]');

export const pick = (obj, locale, fallback = 'en') =>
  obj && typeof obj === 'object' ? obj[locale] ?? obj[fallback] ?? Object.values(obj)[0] ?? '' : obj ?? '';

export const normalizeLocale = (l) => (['en', 'fr', 'de'].includes(l) ? l : 'en');
