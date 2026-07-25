/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    // Strip trailing slashes or /api from environment variable if present
    const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3002';
    const baseUrl = rawApiUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');

    return [
      {
        source: '/api/:path*',
        destination: `${baseUrl}/api/:path*`,
      },
    ];
  }
};

export default nextConfig;
