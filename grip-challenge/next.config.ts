import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // The Boostapp attendance report is uploaded through a server action.
  experimental: { serverActions: { bodySizeLimit: '5mb' } },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ]
  },
}

export default nextConfig
