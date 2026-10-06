/** Vanguard Outdoor — minimalist mark: a "V" chevron that doubles as a valley between two peaks, with a summit marker. Colours follow the theme. */
export function LogoMark({ className = 'h-8 w-8', inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="10" className={inverted ? 'fill-white' : 'fill-ink'} />
      <path d="M9 12 20 30 31 12" fill="none" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" className={inverted ? 'stroke-ink' : 'stroke-white'} />
      <path d="M26.5 11h7l-3.5-5.6Z" style={{ fill: `rgb(var(--c-${inverted ? 'moss' : 'logo-accent'}))` }} />
    </svg>
  );
}

export function Logo({ inverted = false, className = '' }: { inverted?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark inverted={inverted} className="h-8 w-8 shrink-0" />
      {/* the real space between the two words keeps the accessible name identical to the visible text */}
      <span className="flex flex-col leading-none">
        <span className={`text-[16px] font-extrabold tracking-[0.18em] ${inverted ? 'text-white' : 'text-ink'}`}>VANGUARD</span>{' '}
        <span className={`mt-1 text-[9px] font-semibold tracking-[0.42em] ${inverted ? 'text-lichen' : 'text-moss'}`}>OUTDOOR</span>
      </span>
    </span>
  );
}
