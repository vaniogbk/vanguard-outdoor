import type { Metadata } from 'next';

// Personal, signed links: never indexed
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
