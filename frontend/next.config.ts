/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['192.168.0.113'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '192.168.0.113',
        port: '3001',
        pathname: '/uploads/**',
      },
    ],
  },
}

module.exports = nextConfig
