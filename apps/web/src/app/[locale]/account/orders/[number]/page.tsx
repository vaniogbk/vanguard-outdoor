'use client';

import Link from 'next/link';
import { useEffect, useState, use } from 'react';
import { api } from '@/lib/api';
import { useAuth, useI18n } from '@/lib/providers';
import type { Order } from '@/lib/types';
import { OrderDetail } from '@/components/OrderDetail';

export default function AccountOrderPage(props: { params: Promise<{ number: string }> }) {
  const params = use(props.params);
  const { dict, locale } = useI18n();
  const { token, ready } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!ready) return;
    if (!token) { setError(true); return; }
    api<{ order: Order }>(`/api/orders/${params.number}`, { token }).then((r) => setOrder(r.order)).catch(() => setError(true));
  }, [ready, token, params.number]);

  return (
    <div className="container-site py-12">
      <Link href={`/${locale}/account`} className="text-sm text-mute hover:text-ink">← {dict.account.title}</Link>
      <div className="mt-6">
        {error ? <p className="text-mute">{dict.common.notFound}</p> : order ? <OrderDetail order={order} /> : <p className="text-mute">{dict.common.loading}</p>}
      </div>
    </div>
  );
}
