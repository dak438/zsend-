import type { Metadata } from 'next';

/**
 * Prevents search engines from indexing the onboarding flow.
 * (FEATURE_seo_and_security_audit.md §A3)
 */
export const metadata: Metadata = {
  title: 'Setup Your Character | ASCEND',
  robots: {
    index: false,
    follow: false,
  },
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
