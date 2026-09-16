import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://ascend.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/faq', '/login', '/signup'],
        disallow: [
          '/', // Dashboard — personal progress data, must never be indexed
          '/api/', // All API routes
          '/onboarding', // Post-auth setup flow
          '/progress', // Personal XP charts
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
