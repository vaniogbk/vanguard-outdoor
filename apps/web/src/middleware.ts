import { NextResponse, type NextRequest } from 'next/server';

const locales = ['en', 'fr', 'de'];
const defaultLocale = 'en';

// Country → language fallback when Accept-Language is missing (Vercel geo header)
const COUNTRY_LOCALE: Record<string, string> = {
  FR: 'fr', BE: 'fr', LU: 'fr', MC: 'fr', CH: 'de', DE: 'de', AT: 'de', LI: 'de',
};

function detect(req: NextRequest) {
  const cookie = req.cookies.get('NEXT_LOCALE')?.value;
  if (cookie && locales.includes(cookie)) return cookie;
  const header = req.headers.get('accept-language') || '';
  for (const part of header.split(',')) {
    const lang = part.split(';')[0].trim().slice(0, 2).toLowerCase();
    if (locales.includes(lang)) return lang;
  }
  const country = req.headers.get('x-vercel-ip-country') || '';
  return COUNTRY_LOCALE[country] || defaultLocale;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasLocale = locales.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (hasLocale) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = `/${detect(req)}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico|icon|apple-icon|robots.txt|sitemap.xml|.*\\.[\\w]+$).*)'],
};
