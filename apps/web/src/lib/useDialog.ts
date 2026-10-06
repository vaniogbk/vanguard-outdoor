'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Behaviour shared by the drawers and sheets: focus moves inside, Tab stays inside, Escape closes,
 * the page behind does not scroll, and focus returns to the trigger afterwards.
 */
export function useDialog(ref: RefObject<HTMLElement | null>, active: boolean, onClose: () => void) {
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    if (!active) return;
    const el = ref.current;
    if (!el) return;
    const previous = document.activeElement as HTMLElement | null;
    const focusables = () => Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.offsetParent !== null);
    focusables()[0]?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { close.current(); return; }
      if (e.key !== 'Tab') return;
      const list = focusables();
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.({ preventScroll: true });
    };
  }, [active, ref]);
}

export type Phase = 'closed' | 'open' | 'closing';

/** open → closing (plays the exit animation) → closed: keeps a panel mounted just long enough to animate out */
export function usePresence(open: boolean, exitMs = 240): Phase {
  const [phase, setPhase] = useState<Phase>(open ? 'open' : 'closed');
  useEffect(() => {
    if (open) setPhase('open');
    else setPhase((p) => (p === 'open' ? 'closing' : p));
  }, [open]);
  useEffect(() => {
    if (phase !== 'closing') return;
    const t = setTimeout(() => setPhase('closed'), exitMs);
    return () => clearTimeout(t);
  }, [phase, exitMs]);
  return phase;
}
