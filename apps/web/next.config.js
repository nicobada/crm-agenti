/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.INTERNAL_API_URL || 'http://localhost:3001'}/:path*`,
      },
    ];
  },
  images: {
    domains: ['localhost'],
  },
};

module.exports = nextConfig;
