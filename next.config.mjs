/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      { source: '/llms.txt', destination: '/api/llms-txt' },
      { source: '/llms-full.txt', destination: '/api/llms-txt' },
    ]
  },
}

export default nextConfig
