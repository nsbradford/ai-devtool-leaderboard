// 🗺️ SITEMAP - Helping search engines navigate the chaos
// Because even Google needs a map sometimes

import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.aitooltracker.dev';

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily', // We update daily, because AI waits for no one!
      priority: 1, // This is #1, obviously 🏆
    },
    // Add any future pages here as you expand the site
    // (Future us will thank present us for this comment)
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
