export type ProductSummary = {
  id: string;
  slug: string;
  brand: string;
  brandName: string;
  title: string;
  category: { slug: string; name: string } | null;
  image: string | null;
  hoverImage: string | null;
  priceCents: number;
  maxPriceCents: number;
  compareAtCents: number | null;
  inStock: boolean;
  featured: boolean;
  rating: number | null;
};

export type Variant = {
  id: string;
  sku: string;
  title: string;
  options: Record<string, string>;
  priceCents: number;
  compareAtCents: number | null;
  inStock: boolean;
  stock?: number;
  weightGrams: number;
};

export type Product = ProductSummary & {
  description: string;
  highlights: string[];
  images: string[];
  tags: string[];
  variants: Variant[];
  updatedAt: string;
};

export type Category = { id: number; slug: string; name: string; description: string; image: string | null; productCount: number };

export type Address = {
  firstName: string; lastName: string; company?: string; line1: string; line2?: string;
  postalCode: string; city: string; country: string; phone?: string;
};

export type OrderStatus = 'pending_payment' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | 'payment_failed';

export type Order = {
  id: string; number: string; status: OrderStatus; email: string; locale: string; currency: string;
  subtotalCents: number; shippingCents: number; discountCents: number; vatCents: number; vatRate: number; totalCents: number;
  shippingAddress: Address; shippingMethod: string; carrier: string | null; trackingNumber: string | null; trackingUrl: string | null;
  paymentProvider: string; createdAt: string; paidAt: string | null; shippedAt: string | null; deliveredAt: string | null;
  items: { id: string; productId: string | null; variantId: string | null; title: string; variantTitle: string | null; sku: string; image: string | null; unitPriceCents: number; quantity: number; lineTotalCents: number }[];
  events: { type: string; message: string; data?: Record<string, unknown>; createdAt: string }[];
  itemCount?: number; image?: string | null; userId?: string | null; paymentReference?: string | null; notes?: string | null;
};

export type User = { id: string; email: string; firstName: string; lastName: string; role: 'customer' | 'admin'; locale: string; defaultAddress: Address | null };

export type Quote = {
  currency: string;
  lines: { variantId: string; productId: string; slug: string; title: string; variantTitle: string | null; sku: string; image: string | null; unitPriceCents: number; quantity: number; lineTotalCents: number; available: number }[];
  problems: { variantId: string; reason: string; available?: number }[];
  subtotalCents: number; shippingCents: number; shippingMethod: string | null;
  shippingOptions: { id: 'standard' | 'express'; priceCents: number; days: [number, number]; freeOverCents?: number }[];
  vatRate: number; vatCents: number; totalCents: number;
};
