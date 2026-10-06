import type { Config } from 'tailwindcss';

const v = (name: string) => `rgb(var(--c-${name}) / <alpha-value>)`;

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Colours come from CSS variables (see globals.css) so the whole store can switch theme:
      // NEXT_PUBLIC_THEME=forest (default, vegetation palette) | classic (black / white / red)
      colors: {
        ink: { DEFAULT: v('ink'), 900: v('ink'), 800: v('ink-800'), 700: v('ink-700'), 600: v('ink-600') },
        paper: { DEFAULT: v('paper'), 50: v('paper-50'), 100: v('paper-100'), 200: v('paper-200') },
        signal: { DEFAULT: v('signal'), 600: v('signal-600'), 50: v('signal-50') },
        moss: { DEFAULT: v('moss'), 600: v('moss-600') },
        lichen: v('lichen'),
        mute: v('mute'),
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
      },
      letterSpacing: { tightest: '-0.04em' },
      maxWidth: { site: '1360px' },
      screens: { xs: '420px' },
      // Elevation + easing tokens live in globals.css so a theme can retune them in one place
      boxShadow: {
        soft: 'var(--shadow-soft)',
        lift: 'var(--shadow-lift)',
        float: 'var(--shadow-float)',
        glow: 'var(--shadow-glow)',
      },
      transitionTimingFunction: { smooth: 'var(--ease-out)', spring: 'var(--ease-spring)' },
      keyframes: {
        'fade-up': { '0%': { opacity: '0', transform: 'translate3d(0,14px,0)' }, '100%': { opacity: '1', transform: 'none' } },
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'fade-out': { '0%': { opacity: '1' }, '100%': { opacity: '0' } },
        'scale-in': { '0%': { opacity: '0', transform: 'scale(.94)' }, '100%': { opacity: '1', transform: 'none' } },
        rise: { '0%': { transform: 'translate3d(0,108%,0)' }, '100%': { transform: 'none' } },
        'slide-in-right': { '0%': { transform: 'translate3d(100%,0,0)' }, '100%': { transform: 'none' } },
        'slide-out-right': { '0%': { transform: 'none' }, '100%': { transform: 'translate3d(100%,0,0)' } },
        'slide-in-left': { '0%': { transform: 'translate3d(-100%,0,0)' }, '100%': { transform: 'none' } },
        'slide-out-left': { '0%': { transform: 'none' }, '100%': { transform: 'translate3d(-100%,0,0)' } },
        'sheet-up': { '0%': { transform: 'translate3d(0,100%,0)' }, '100%': { transform: 'none' } },
        'sheet-down': { '0%': { transform: 'none' }, '100%': { transform: 'translate3d(0,100%,0)' } },
        pop: { '0%': { transform: 'scale(0)' }, '60%': { transform: 'scale(1.18)' }, '100%': { transform: 'scale(1)' } },
        bump: { '0%,100%': { transform: 'scale(1)' }, '40%': { transform: 'scale(1.5)' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        float: { '0%,100%': { transform: 'translate3d(0,0,0)' }, '50%': { transform: 'translate3d(0,-10px,0)' } },
        pan: { '0%,100%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' } },
        cue: { '0%,100%': { transform: 'translateY(0)', opacity: '.9' }, '50%': { transform: 'translateY(7px)', opacity: '.35' } },
        draw: { to: { strokeDashoffset: '0' } },
        grow: { '0%': { transform: 'scaleX(0)' }, '100%': { transform: 'scaleX(1)' } },
        confetti: {
          '0%': { transform: 'translate3d(0,-20px,0) rotate(0deg)', opacity: '0' },
          '10%': { opacity: '1' },
          '100%': { transform: 'translate3d(var(--dx,0px),420px,0) rotate(var(--rot,360deg))', opacity: '0' },
        },
      },
      animation: {
        'fade-up': 'fade-up .65s var(--ease-out) both',
        'fade-in': 'fade-in .35s ease-out both',
        'fade-out': 'fade-out .24s ease-in both',
        'scale-in': 'scale-in .35s var(--ease-out) both',
        rise: 'rise .9s var(--ease-out) both',
        'slide-in-right': 'slide-in-right .38s var(--ease-out) both',
        'slide-out-right': 'slide-out-right .24s cubic-bezier(.4,0,1,1) both',
        'slide-in-left': 'slide-in-left .38s var(--ease-out) both',
        'slide-out-left': 'slide-out-left .24s cubic-bezier(.4,0,1,1) both',
        'sheet-up': 'sheet-up .42s var(--ease-out) both',
        'sheet-down': 'sheet-down .26s cubic-bezier(.4,0,1,1) both',
        pop: 'pop .5s var(--ease-spring) both',
        bump: 'bump .5s var(--ease-out)',
        shimmer: 'shimmer 1.6s infinite',
        float: 'float 7s ease-in-out infinite',
        pan: 'pan 16s ease-in-out infinite',
        cue: 'cue 2.4s ease-in-out infinite',
        draw: 'draw .55s .15s var(--ease-out) forwards',
        grow: 'grow .9s var(--ease-out) both',
        confetti: 'confetti 2.4s var(--ease-out) forwards',
      },
    },
  },
  plugins: [],
};
export default config;
