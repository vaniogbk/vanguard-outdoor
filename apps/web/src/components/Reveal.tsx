'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';

type Props = {
  as?: 'div' | 'section' | 'li' | 'article' | 'ul' | 'header';
  /** stagger: delay in ms before the transition starts */
  delay?: number;
  from?: 'up' | 'left' | 'scale';
  className?: string;
  children: ReactNode;
};

/**
 * Eases a block in when it scrolls into view. Progressive by design:
 *  - the server HTML is fully visible (no JavaScript → nothing is hidden, nothing flashes),
 *  - blocks already on screen at load are left alone,
 *  - only blocks below the fold are hidden after hydration, then revealed once.
 * Reduced-motion users see everything immediately (also enforced in CSS).
 */
export function Reveal({ as = 'div', delay = 0, from = 'up', className, children }: Props) {
  const Tag = as as 'div';
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
    el.dataset.state = 'hidden';
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        el.dataset.state = 'shown';
        io.disconnect();
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag ref={ref} data-reveal="" data-reveal-from={from} style={{ '--reveal-delay': `${delay}ms` } as CSSProperties} className={className}>
      {children}
    </Tag>
  );
}
