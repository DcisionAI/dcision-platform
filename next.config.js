const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  output: 'standalone',
  webpack: (config, { isServer }) => {
    // Monaco editor webpack config
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
        "crypto": false
      }
    }
    return config
  },
  swcMinify: true,
  // Add redirect configuration
  async redirects() {
    return [
      {
        source: '/',
        destination: '/modelbuilder',
        permanent: true,
      },
    ]
  },
}

module.exports = withBundleAnalyzer(nextConfig) 