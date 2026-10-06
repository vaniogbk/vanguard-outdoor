import type { OrderStatus } from '@/lib/types';

const STYLES: Record<OrderStatus, string> = {
  pending_payment: 'bg-paper-200 text-ink',
  paid: 'bg-ink text-white',
  processing: 'bg-ink text-white',
  shipped: 'bg-signal text-white',
  delivered: 'bg-emerald-700 text-white',
  cancelled: 'bg-paper-200 text-mute line-through',
  refunded: 'bg-paper-200 text-mute',
  payment_failed: 'bg-signal-50 text-signal-600',
};

export function StatusBadge({ status, label }: { status: OrderStatus; label: string }) {
  return <span className={`inline-flex h-6 items-center whitespace-nowrap rounded-full px-2.5 text-[11px] font-bold leading-none ${STYLES[status] || ''}`}>{label}</span>;
}
