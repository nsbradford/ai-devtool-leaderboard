/** @type {import('next').NextConfig} */
const nextConfig = {
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

module.exports = nextConfig;
