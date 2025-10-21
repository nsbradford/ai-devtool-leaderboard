import { MetadataRoute } from 'next';

/**
 * Generates the robots.txt configuration for search engine crawlers.
 * 
 * @returns Robots metadata with crawling rules and sitemap location
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/'], // Disallow API routes from being indexed
    },
    sitemap: 'https://www.aitooltracker.dev/sitemap.xml',
  };
}
