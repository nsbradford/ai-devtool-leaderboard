import type { NextConfig } from 'next';

/**
 * Next.js configuration for the AI Code Review Adoption Tracker.
 * 
 * Configuration includes:
 * - External packages for server-side execution (BigQuery)
 * - Remote image patterns for GitHub avatars
 */
const nextConfig: NextConfig = {
  serverExternalPackages: ['@google-cloud/bigquery'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
