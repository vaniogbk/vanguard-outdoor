'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuth, useCart, useI18n } from '@/lib/providers';
import { useDialog, usePresence } from '@/lib/useDialog';
import type { Category } from '@/lib/types';
import { Logo } from './Logo';
import { IconBag, IconMenu, IconSearch, IconUser, IconX } from './icons';
import { CartDrawer } from './CartDrawer';

export function Header({ categories }: { categories: Pick<Category, 'slug' | 'name' | 'productCount'>[] }) {
  const { dict, locale } = useI18n();
  const { count, setOpen } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const phase = usePresence(menuOpen);
  const panelRef = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState('');
  const [scrolled, setScrolled] = useState(false);
  useDialog(panelRef, phase === 'open', () => setMenuOpen(false)); // active once the panel is mounted, released when it starts closing

  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const nav = categories.filter((c) => c.productCount > 0);
  const notes = dict.announcement.split(' · ');
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setMenuOpen(false);
    router.push(`/${locale}/shop${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`);
  };
  const closing = phase === 'closing';

  return (
    <>
      <div className="bg-gradient-to-r from-ink via-ink-700 to-ink px-4 py-1.5 text-center text-[11.5px] font-medium tracking-wide text-white/90">
        <ul className="flex items-center justify-center">
          {notes.map((n, i) => (
            <li key={n} className={i === 0 ? '' : "hidden sm:block sm:before:mx-3 sm:before:opacity-40 sm:before:content-['·']"}>{n}</li>
          ))}
        </ul>
      </div>

      {/* fixed height: the header never changes size while scrolling, so nothing below it ever jumps */}
      <header className={`sticky top-0 z-40 border-b backdrop-blur-xl transition-[background-color,box-shadow,border-color] duration-300 ${scrolled ? 'border-paper-200/70 bg-[rgb(var(--c-body)/0.9)] shadow-[0_10px_30px_-18px_rgb(var(--c-ink)/0.35)]' : 'border-transparent bg-[rgb(var(--c-body)/0.72)]'}`}>
        <div className="mx-auto flex h-14 max-w-site items-center gap-3 px-4 sm:gap-6 sm:px-6 lg:h-16 lg:px-10">
          <button className="icon-btn -ml-1.5 lg:hidden" onClick={() => setMenuOpen(true)} aria-label={dict.nav.menu} aria-expanded={menuOpen}><IconMenu /></button>
          <Link href={`/${locale}`} aria-label="Vanguard Outdoor" className={`shrink-0 origin-left transition-transform duration-300 ease-smooth ${scrolled ? 'scale-[.94]' : ''}`}><Logo /></Link>

          <nav className="hidden min-w-0 flex-1 items-center gap-5 overflow-hidden lg:flex xl:gap-6" aria-label="Main">
            <Link href={`/${locale}/shop`} className="nav-link" aria-current={pathname === `/${locale}/shop` ? 'page' : undefined}>{dict.nav.all}</Link>
            {nav.slice(0, 5).map((c, i) => (
              <Link key={c.slug} href={`/${locale}/shop/${c.slug}`} className={`nav-link ${i >= 3 ? 'hidden 2xl:block' : ''}`} aria-current={pathname?.endsWith(`/shop/${c.slug}`) ? 'page' : undefined}>{c.name}</Link>
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1.5">
            <form onSubmit={submit} className="relative hidden md:block" role="search">
              <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mute" width={15} height={15} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={dict.nav.search} aria-label={dict.nav.search}
                className="h-9 w-40 rounded-full border border-paper-200 bg-white/80 pl-9 pr-3 text-[13px] outline-none transition-all duration-300 ease-smooth placeholder:text-mute/70 focus:w-60 focus:border-signal/50 focus:bg-white focus:ring-4 focus:ring-signal/10 xl:w-48 xl:focus:w-64" />
            </form>
            {user?.role === 'admin' && (
              <Link href={`/${locale}/admin`} className="chip-signal mr-1 hidden sm:inline-flex">{dict.nav.admin}</Link>
            )}
            <Link href={`/${locale}/account`} className="icon-btn" aria-label={dict.nav.account}><IconUser /></Link>
            <button onClick={() => setOpen(true)} className="icon-btn" aria-label={`${dict.nav.cart} (${count})`}>
              <IconBag />
              {count > 0 && (
                // key = count → the badge remounts and replays its "bump" each time the cart changes
                <span key={count} className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] animate-bump items-center justify-center rounded-full bg-signal px-1 text-[10px] font-bold leading-none text-white ring-2 ring-[rgb(var(--c-body))]">{count}</span>
              )}
            </button>
          </div>
        </div>
      </header>

      {phase !== 'closed' && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className={`absolute inset-0 bg-ink/50 backdrop-blur-[2px] ${closing ? 'animate-fade-out' : 'animate-fade-in'}`} onClick={() => setMenuOpen(false)} />
          <div ref={panelRef} role="dialog" aria-modal="true" aria-label={dict.nav.menu}
            className={`absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col rounded-r-3xl bg-white shadow-float ${closing ? 'animate-slide-out-left' : 'animate-slide-in-left'}`}>
            <div className="flex h-14 items-center justify-between border-b border-paper-200 px-4">
              <Logo />
              <button className="icon-btn" onClick={() => setMenuOpen(false)} aria-label={dict.nav.close}><IconX /></button>
            </div>
            <form onSubmit={submit} className="border-b border-paper-200 p-4" role="search">
              <div className="relative">
                <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mute" width={15} height={15} />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={dict.nav.search} aria-label={dict.nav.search} className="input rounded-full pl-9" />
              </div>
            </form>
            <nav className="flex-1 overflow-y-auto p-3" aria-label="Menu">
              {[{ href: `/${locale}/shop`, label: dict.nav.all, count: null as number | null }, ...nav.map((c) => ({ href: `/${locale}/shop/${c.slug}`, label: c.name, count: c.productCount as number | null }))].map((l, i) => (
                <Link key={l.href} href={l.href} style={{ animationDelay: `${90 + i * 40}ms` }}
                  className="flex animate-fade-up items-center justify-between rounded-xl px-3 py-2.5 text-[17px] font-semibold transition-colors hover:bg-paper-50">
                  {l.label}{l.count !== null && <span className="chip-soft">{l.count}</span>}
                </Link>
              ))}
              <div className="mt-4 space-y-1 border-t border-paper-200 pt-4 text-[15px] font-medium">
                <Link href={`/${locale}/account`} className="block rounded-xl px-3 py-2 hover:bg-paper-50">{dict.nav.account}</Link>
                <Link href={`/${locale}/track`} className="block rounded-xl px-3 py-2 hover:bg-paper-50">{dict.nav.track}</Link>
                {user?.role === 'admin' && <Link href={`/${locale}/admin`} className="block rounded-xl px-3 py-2 text-signal hover:bg-paper-50">{dict.nav.admin}</Link>}
              </div>
            </nav>
          </div>
        </div>
      )}
      <CartDrawer />
    </>
  );
}
