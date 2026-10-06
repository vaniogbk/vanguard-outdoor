'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import shopifyLoader from '@/lib/image-loader';

/** Deterministic pine-tree skyline (no randomness → identical on server and client) */
function treeline(width: number, height: number, seed: number) {
  let d = `M0 ${height}`;
  let x = 0;
  let k = seed;
  const rnd = () => ((k = (k * 9301 + 49297) % 233280) / 233280);
  while (x < width) {
    const w = 14 + rnd() * 22;
    const h = height * (0.35 + rnd() * 0.6);
    const base = height - 6 - rnd() * 10;
    d += ` L${x.toFixed(1)} ${base.toFixed(1)} L${(x + w / 2).toFixed(1)} ${(height - h).toFixed(1)} L${(x + w).toFixed(1)} ${base.toFixed(1)}`;
    x += w * (0.55 + rnd() * 0.35);
  }
  return `${d} L${width} ${height} Z`;
}

const FAR = treeline(1440, 150, 7);
const NEAR = treeline(1440, 110, 42);
const drift = (px: number) => ({ '--parallax': `${px}px` }) as CSSProperties;

/**
 * Hero background: lifestyle photo (if it loads) + layered mountains & forest silhouettes in theme colours.
 * Motion: the photo and the far mountains drift slower than the page (scroll-driven CSS, `.parallax`), two soft glows float
 * (transform only). Everything is decorative, aria-hidden and switched off for users who prefer reduced motion.
 */
export function HeroBackdrop({ image }: { image?: string }) {
  const [ok, setOk] = useState(Boolean(image));
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setOk(false);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <div className="absolute inset-0 topo-light" />
      <span className="absolute -left-24 top-8 h-80 w-80 animate-float rounded-full bg-lichen/20 blur-3xl" />
      <span className="absolute right-0 top-1/3 h-96 w-96 animate-float rounded-full bg-signal/15 blur-3xl [animation-delay:-3.5s]" />
      {/* mountains */}
      <svg viewBox="0 0 1440 640" preserveAspectRatio="xMidYMax slice" className="parallax absolute inset-0 h-full w-full" style={drift(36)}>
        <circle cx="1090" cy="210" r="70" style={{ fill: 'rgb(var(--c-paper-200) / .22)' }} />
        <path d="M560 640 820 330l90 95 160-215 190 250 200-150v330Z" style={{ fill: 'rgb(var(--c-ink-600))' }} />
        <path d="M1070 210l-34 45 18-8 16 14 16-14 18 8Z" style={{ fill: 'rgb(255 255 255 / .85)' }} />
        <path d="M380 640 690 420l120 80 180-140 220 150 160-90 90 60v160Z" style={{ fill: 'rgb(var(--c-ink-700))' }} />
      </svg>
      {image && ok && (
        <div className="parallax absolute inset-0" style={drift(56)}>
          <Image ref={ref} loader={shopifyLoader} src={image} alt="" fill priority sizes="100vw" className="object-cover" onError={() => setOk(false)} />
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/20" />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/70 to-transparent" />
        </div>
      )}
      {/* forest edge */}
      <svg viewBox="0 0 1440 150" preserveAspectRatio="xMidYMax slice" className="absolute inset-x-0 bottom-0 h-28 w-full sm:h-36">
        <path d={FAR} style={{ fill: 'rgb(var(--c-ink-800))' }} />
      </svg>
      <svg viewBox="0 0 1440 110" preserveAspectRatio="xMidYMax slice" className="absolute inset-x-0 -bottom-px h-16 w-full sm:h-20">
        <path d={NEAR} style={{ fill: 'rgb(var(--c-body))' }} />
      </svg>
    </div>
  );
}
