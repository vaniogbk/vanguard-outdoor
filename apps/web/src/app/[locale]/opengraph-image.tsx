import { ImageResponse } from 'next/og';
import { getDictionary } from '@/lib/i18n';
import { THEME_HEX } from '@/lib/theme';

export const runtime = 'edge';
export const alt = 'Vanguard Outdoor';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OG({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params; // a Promise since Next 15 (awaiting a plain object is harmless)
  const dict = getDictionary(locale);
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', background: THEME_HEX.ink, color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 72 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <svg width="72" height="72" viewBox="0 0 40 40"><rect width="40" height="40" fill="#fff" /><path d="M8 11 20 31 32 11" fill="none" stroke={THEME_HEX.ink} strokeWidth="4.2" /><path d="M26.5 11h7l-3.5-5.6Z" fill={THEME_HEX.moss} /></svg>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 40, fontWeight: 800, letterSpacing: 8 }}>VANGUARD</span>
            <span style={{ fontSize: 20, color: THEME_HEX.accent, letterSpacing: 14 }}>OUTDOOR</span>
          </div>
        </div>
        <div style={{ fontSize: 78, fontWeight: 800, lineHeight: 1, textTransform: 'uppercase', maxWidth: 1000 }}>{dict.home.heroTitle}</div>
        <div style={{ fontSize: 26, color: 'rgba(255,255,255,.65)' }}>Reactive Outdoor · Kilos Gear · EU · UK · CH</div>
      </div>
    ),
    size,
  );
}
