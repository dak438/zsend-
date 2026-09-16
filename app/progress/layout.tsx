import type { Metadata } from 'next';

/**
 * Prevents search engines from indexing the user's personal progress page.
 * Personal XP/chart data must never appear in search results.
 * (FEATURE_seo_and_security_audit.md §A3)
 */
export const metadata: Metadata = {
  title: 'Progress | ASCEND',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProgressLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
