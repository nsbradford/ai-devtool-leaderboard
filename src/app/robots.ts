import { MetadataRoute } from 'next';

/**
 * Generates the robots.txt configuration for the site.
 * Allows all crawlers to index the site but disallows API routes.
 * @returns Robots.txt metadata configuration
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
