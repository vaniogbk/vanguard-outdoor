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

export function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    // unexpected errors stay opaque; deliberate HttpErrors (e.g. 502 from a PSP) keep their message
    error: status >= 500 && !(err instanceof HttpError) ? 'Internal server error' : err.message,
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
