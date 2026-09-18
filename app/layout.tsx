import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import AuthProvider from '@/components/AuthProvider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const baseUrl = process.env.NEXTAUTH_URL || 'https://ascend.app';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'ASCEND — Real Life Character Progression',
    template: '%s | ASCEND',
  },
  description: 'Track your daily execution across 2–6 custom life attributes. Earn server-verified XP, build honor streaks, and level up without stat decay.',
  keywords: ['gamified habit tracker', 'solo leveling habit app', 'life rpg', 'productivity gamification', 'daily habits', 'character progression'],
  authors: [{ name: 'ASCEND Team' }],
  creator: 'ASCEND',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: baseUrl,
    siteName: 'ASCEND',
    title: 'ASCEND — Real Life Character Progression',
    description: 'Level up your life like an RPG character. Build real-world strength, intellect, and discipline with server-verified XP and zero stat decay.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ASCEND RPG Character Progression Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ASCEND — Real Life Character Progression',
    description: 'Level up your life like an RPG character. Custom stats, daily quests, honor streaks.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-canvas text-text-primary min-h-screen antialiased font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
