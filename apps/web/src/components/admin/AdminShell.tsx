'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, useI18n } from '@/lib/providers';
import { api } from '@/lib/api';
import { useCallback } from 'react';

const NAV = [
  { href: '', label: 'Tableau de bord' },
  { href: '/orders', label: 'Commandes' },
  { href: '/products', label: 'Produits' },
  { href: '/customers', label: 'Clients' },
];

/** Typed admin fetch bound to the current token */
export function useAdminApi() {
  const { token } = useAuth();
  return useCallback(<T,>(path: string, init: Parameters<typeof api>[1] = {}) => api<T>(`/api/admin${path}`, { ...init, token }), [token]);
}

export const STATUS_FR: Record<string, string> = {
  pending_payment: 'En attente de paiement', paid: 'Payée', processing: 'En préparation', shipped: 'Expédiée',
  delivered: 'Livrée', cancelled: 'Annulée', refunded: 'Remboursée', payment_failed: 'Paiement échoué',
};

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const { locale } = useI18n();
  const pathname = usePathname() || '';
  const base = `/${locale}/admin`;

  if (!ready) return <div className="container-site py-24 text-mute">Chargement…</div>;
  if (!user || user.role !== 'admin') {
    return (
      <div className="container-site flex flex-col items-center gap-4 py-32 text-center">
        <h1 className="h-display text-3xl">Accès réservé</h1>
        <p className="text-mute">Connectez-vous avec un compte administrateur.</p>
        <Link href={`/${locale}/account`} className="btn-primary">Se connecter</Link>
      </div>
    );
  }
  return (
    <div className="container-site grid gap-6 py-8 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-8">
      <aside className="min-w-0">
        <p className="eyebrow">Admin</p>
        <nav className="no-scrollbar mt-4 flex gap-1 overflow-x-auto lg:flex-col" aria-label="Admin">
          {NAV.map((n) => {
            const href = `${base}${n.href}`;
            const active = n.href === '' ? pathname === base : pathname.startsWith(href);
            return (
              <Link key={n.href} href={href} aria-current={active ? 'page' : undefined}
                className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors duration-200 ${active ? 'bg-ink text-white' : 'hover:bg-paper-100'}`}>{n.label}</Link>
            );
          })}
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
