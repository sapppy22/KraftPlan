/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@forgefit/shared'],
  images: {
    domains: ['localhost'],
  },
  experimental: {},
};

export default nextConfig;
