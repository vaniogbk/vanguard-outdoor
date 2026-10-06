import type { SVGProps } from 'react';

const base = (p: SVGProps<SVGSVGElement>) => ({
  width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75,
  strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true, ...p,
});

export const IconSearch = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>);
export const IconBag = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>);
export const IconUser = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>);
export const IconMenu = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M3 7h18M3 12h18M3 17h18" /></svg>);
export const IconX = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M6 6l12 12M18 6 6 18" /></svg>);
export const IconArrow = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>);
export const IconTruck = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="18" r="1.8" /><circle cx="17" cy="18" r="1.8" /></svg>);
export const IconLock = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><rect x="5" y="11" width="14" height="9" rx="1" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>);
export const IconReturn = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M9 14 4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 0 12h-3" /></svg>);
export const IconShield = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6l-8-3Z" /><path d="m9 12 2 2 4-4" /></svg>);
export const IconCheck = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="m5 12 5 5L20 7" /></svg>);
export const IconMinus = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M5 12h14" /></svg>);
export const IconPlus = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>);
export const IconFilter = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M4 6h16M7 12h10M10 18h4" /></svg>);
export const IconStar = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)} fill="currentColor" stroke="none"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" /></svg>);
export const IconArrowUpRight = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M7 17 17 7M8 7h9v9" /></svg>);
export const IconChevronDown = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="m6 9 6 6 6-6" /></svg>);
export const IconCard = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M3 10h18M7 15h3" /></svg>);

/** Line-art pictograms used for categories and image placeholders */
export function CategoryGlyph({ slug, className = '' }: { slug: string; className?: string }) {
  const common = { className, viewBox: '0 0 64 64', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const, 'aria-hidden': true };
  switch (slug) {
    case 'camping':
      return (<svg {...common}><path d="M6 52h52" /><path d="M10 52 32 14l22 38" /><path d="M32 14v38M26 52l6-12 6 12" /></svg>);
    case 'sleeping':
      return (<svg {...common}><rect x="8" y="26" width="48" height="14" rx="7" /><path d="M16 26v14M24 26v14M32 26v14M40 26v14M48 26v14" /></svg>);
    case 'furniture':
      return (<svg {...common}><path d="M18 12h28l-4 22H22l-4-22Z" /><path d="M16 34h32M20 34l-6 18M44 34l6 18M24 34l16 18M40 34 24 52" /></svg>);
    case 'lighting':
      return (<svg {...common}><path d="M26 12h12M28 12v6h8v-6" /><path d="M24 18h16l2 26H22l2-26Z" /><path d="M24 50h16M32 26v10" /><path d="M10 30H6M58 30h-4M14 16l-3-3M50 16l3-3" /></svg>);
    case 'hiking':
      return (<svg {...common}><path d="M20 18a12 12 0 0 1 24 0v34H20V18Z" /><path d="M20 30h24M26 40h12M28 10V6h8v4" /></svg>);
    case 'transport':
      return (<svg {...common}><path d="M8 20h40l-4 18H14L8 20Z" /><circle cx="18" cy="46" r="6" /><circle cx="42" cy="46" r="6" /><path d="M48 20l8-8" /></svg>);
    case 'clothing':
      return (<svg {...common}><path d="M24 8 12 14 6 28l8 4v24h36V32l8-4-6-14-12-6c0 4-4 8-8 8s-8-4-8-8Z" /></svg>);
    default:
      return (<svg {...common}><path d="M24 10h10a12 12 0 0 1 12 12v20a12 12 0 0 1-12 12h-4a12 12 0 0 1-12-12V20" /><path d="M18 20l6-10M18 30v-10" /><path d="M30 24v16" /></svg>);
  }
}
