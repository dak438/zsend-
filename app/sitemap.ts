import { MetadataRoute } from 'next';

/**
 * Sitemap covers only public, indexable routes.
 * The dashboard (/) is intentionally excluded — it is a private authenticated
 * page and must not appear in search results.
 * (FEATURE_seo_and_security_audit.md §A1 + §A3)
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://ascend.app';

  return [
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];
}
