/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Disable SWC minification to see if that's causing the issue
  swcMinify: false,
  experimental: {
    // Remove forceSwcTransforms to see if that's causing the issue
    // forceSwcTransforms: true,
  },
}

module.exports = nextConfig
