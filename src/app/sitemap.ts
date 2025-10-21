import { MetadataRoute } from 'next';

/**
 * Generates the sitemap.xml for search engine optimization.
 * Currently includes the homepage with daily update frequency.
 * @returns Array of sitemap entries
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
