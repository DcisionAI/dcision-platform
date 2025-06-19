const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  webpack: (config, { isServer }) => {
    // Monaco editor webpack config
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
        "crypto": false
      }
    }

    // Exclude Supabase Edge Functions from the build
    config.module.rules.push({
      test: /supabase\/functions\/.*\.ts$/,
      loader: 'null-loader'
    })

    return config
  },
  swcMinify: true,
  // Add redirect configuration
  async redirects() {
    return [
      // Removed the '/' to '/' redirect to prevent infinite loop
    ]
  },
  async headers() {
    return [
      {
        // Allow requests from any origin to the API routes
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
}

module.exports = withBundleAnalyzer(nextConfig) 