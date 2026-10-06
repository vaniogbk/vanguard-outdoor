export const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '');
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

type Opts = RequestInit & { token?: string | null; revalidate?: number | false; json?: unknown };

/** Fetch helper usable in server and client components */
export async function api<T>(path: string, { token, revalidate, json, headers, ...init }: Opts = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    method: init.method || (json !== undefined ? 'POST' : 'GET'),
    headers: {
      Accept: 'application/json',
      ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : init.body,
    ...(typeof window === 'undefined' && revalidate !== undefined
      ? revalidate === false ? { cache: 'no-store' as const } : { next: { revalidate } }
      : {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data?.error || res.statusText, data?.details);
  return data as T;
}

/** Server-side fetch that returns null instead of throwing (keeps pages rendering if the API is down) */
export async function safeApi<T>(path: string, revalidate: number | false = 60): Promise<T | null> {
  try {
    return await api<T>(path, { revalidate });
  } catch (e) {
    console.error(`[api] ${path}:`, (e as Error).message);
    return null;
  }
}
