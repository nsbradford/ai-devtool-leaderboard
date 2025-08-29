import type { NextConfig } from 'next';

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
    // Reduce transformations by limiting formats to just WebP
    formats: ['image/webp'],
    // Set minimum cache TTL to 31 days (31 * 24 * 60 * 60 = 2,678,400 seconds)
    minimumCacheTTL: 2678400,
    // Limit image sizes to reduce transformations
    imageSizes: [16, 24, 32, 48, 64, 96, 128, 256, 384],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // Set quality to 85% (good balance between quality and file size)
    qualities: [85],
  },
};

export default nextConfig;
