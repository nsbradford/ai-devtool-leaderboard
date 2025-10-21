// 🤖 Robots.txt - Where we tell the robots what to do
// Ironic, isn't it? A site about AI bots, controlled by robots.txt

import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*', // All robots welcome! Even the evil ones 😈
      allow: '/',
      disallow: ['/api/'], // Disallow API routes from being indexed (secrets!) 🔒
    },
    sitemap: 'https://www.aitooltracker.dev/sitemap.xml',
  };
}
