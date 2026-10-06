import type { Metadata } from 'next';

// Transactional / private pages are excluded from search indexes
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
