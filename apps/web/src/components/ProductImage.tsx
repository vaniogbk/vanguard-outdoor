'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import shopifyLoader from '@/lib/image-loader';
import { CategoryGlyph } from './icons';

type Props = {
  src: string | null;
  alt: string;
  category?: string | null;
  sizes?: string;
  priority?: boolean;
  className?: string;
  /** 'none' renders nothing when the photo is missing (caller draws its own background) */
  fallback?: 'glyph' | 'none';
};

/** Product photo with a branded placeholder when the image is missing or fails to load */
export function ProductImage({ src, alt, category, sizes = '(min-width: 1024px) 25vw, 50vw', priority, className = '', fallback = 'glyph' }: Props) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  // the error event can fire before hydration — re-check once mounted
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, [src]);
  if (!src || failed) {
    if (fallback === 'none') return null;
    return (
      <div className={`absolute inset-0 flex items-center justify-center bg-paper-100 ${className}`} role="img" aria-label={alt}>
        <div className="absolute inset-0 opacity-[0.35] topo" />
        <CategoryGlyph slug={category || ''} className="relative h-1/3 w-1/3 text-ink/70" />
      </div>
    );
  }
  return (
    <Image
      ref={ref}
      loader={shopifyLoader}
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={`object-cover ${className}`}
      onError={() => setFailed(true)}
    />
  );
}
