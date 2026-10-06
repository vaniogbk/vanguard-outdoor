'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Dictionary, Locale } from './i18n';
import type { User } from './types';
import { api } from './api';

// ───────────── Dictionary ─────────────
const I18nContext = createContext<{ dict: Dictionary; locale: Locale } | null>(null);
export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n outside provider');
  return ctx;
}

// ───────────── Cart ─────────────
export type CartItem = {
  variantId: string;
  slug: string;
  title: string;
  variantTitle: string | null;
  image: string | null;
  priceCents: number;
  quantity: number;
};

type CartCtx = {
  items: CartItem[];
  count: number;
  subtotalCents: number;
  ready: boolean;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (item: CartItem) => void;
  update: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
};
const CartContext = createContext<CartCtx | null>(null);
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart outside provider');
  return ctx;
}

const CART_KEY = 'vg_cart_v1';
const TOKEN_KEY = 'vg_token';

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeStorage(key: string, value: unknown) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable (private mode) — cart stays in memory */
  }
}

// ───────────── Auth ─────────────
type AuthCtx = {
  user: User | null;
  token: string | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { email: string; password: string; firstName?: string; lastName?: string; locale?: string }) => Promise<User>;
  logout: () => void;
  refresh: () => Promise<void>;
};
const AuthContext = createContext<AuthCtx | null>(null);
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside provider');
  return ctx;
}

export function Providers({ dict, locale, children }: { dict: Dictionary; locale: Locale; children: React.ReactNode }) {
  // cart
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartReady, setCartReady] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setItems(readStorage<CartItem[]>(CART_KEY, []));
    setCartReady(true);
  }, []);
  useEffect(() => {
    if (cartReady) writeStorage(CART_KEY, items);
  }, [items, cartReady]);

  const add = useCallback((item: CartItem) => {
    setItems((prev) => {
      const found = prev.find((i) => i.variantId === item.variantId);
      if (found) return prev.map((i) => (i.variantId === item.variantId ? { ...i, quantity: Math.min(i.quantity + item.quantity, 20) } : i));
      return [...prev, item];
    });
    setOpen(true);
  }, []);
  const update = useCallback((variantId: string, quantity: number) => {
    setItems((prev) => (quantity <= 0 ? prev.filter((i) => i.variantId !== variantId) : prev.map((i) => (i.variantId === variantId ? { ...i, quantity: Math.min(quantity, 20) } : i))));
  }, []);
  const remove = useCallback((variantId: string) => setItems((prev) => prev.filter((i) => i.variantId !== variantId)), []);
  const clear = useCallback(() => setItems([]), []);

  const cart = useMemo<CartCtx>(() => ({
    items,
    count: items.reduce((s, i) => s + i.quantity, 0),
    subtotalCents: items.reduce((s, i) => s + i.quantity * i.priceCents, 0),
    ready: cartReady,
    open,
    setOpen,
    add,
    update,
    remove,
    clear,
  }), [items, cartReady, open, add, update, remove, clear]);

  // auth
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const refresh = useCallback(async () => {
    const tk = readStorage<string | null>(TOKEN_KEY, null);
    setToken(tk);
    if (!tk) { setUser(null); setAuthReady(true); return; }
    try {
      const { user } = await api<{ user: User }>('/api/auth/me', { token: tk });
      setUser(user);
    } catch {
      writeStorage(TOKEN_KEY, null);
      setToken(null);
      setUser(null);
    } finally {
      setAuthReady(true);
    }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const persist = (data: { token: string; user: User }) => {
    writeStorage(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };
  const auth = useMemo<AuthCtx>(() => ({
    user,
    token,
    ready: authReady,
    login: async (email, password) => persist(await api('/api/auth/login', { json: { email, password } })),
    register: async (data) => persist(await api('/api/auth/register', { json: data })),
    logout: () => { writeStorage(TOKEN_KEY, null); setToken(null); setUser(null); },
    refresh,
  }), [user, token, authReady, refresh]);

  const i18n = useMemo(() => ({ dict, locale }), [dict, locale]);

  return (
    <I18nContext.Provider value={i18n}>
      <AuthContext.Provider value={auth}>
        <CartContext.Provider value={cart}>{children}</CartContext.Provider>
      </AuthContext.Provider>
    </I18nContext.Provider>
  );
}
