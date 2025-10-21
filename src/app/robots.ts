// Copyright 2025 Anysphere Inc.

import { MetadataRoute } from 'next';

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
