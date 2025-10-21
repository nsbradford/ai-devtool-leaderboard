import { MetadataRoute } from 'next';

/**
 * Generates the sitemap for search engines.
 * 
 * @returns Array of sitemap entries with URLs, priorities, and update frequencies
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.aitooltracker.dev';

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    // Add any future pages here as you expand the site
    // {
    //   url: `${baseUrl}/about`,
    //   lastModified: new Date(),
    //   changeFrequency: 'monthly',
    //   priority: 0.8,
    // },
    // {
    //   url: `${baseUrl}/api`,
    //   lastModified: new Date(),
    //   changeFrequency: 'weekly',
    //   priority: 0.6,
    // },
  ];
}
