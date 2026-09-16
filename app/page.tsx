import type { Metadata } from 'next';
import DashboardClient from './DashboardClient';

/**
 * Server shell for the dashboard (/) route.
 * Exports noindex metadata so personal progress data is never indexed
 * by search engines. The actual interactive UI lives in DashboardClient.
 * (FEATURE_seo_and_security_audit.md §A3)
 */
export const metadata: Metadata = {
  title: 'Dashboard | ASCEND',
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardPage() {
  return <DashboardClient />;
}
