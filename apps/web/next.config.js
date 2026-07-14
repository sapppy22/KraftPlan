/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@kraftplan/shared'],
  images: {
    // Local mark is served from /public; remote media (exercise thumbs) via CDN/R2.
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  experimental: {},
  webpack(config) {
    // Workspace packages (@kraftplan/*) are authored in TypeScript using
    // NodeNext-style `.js` import specifiers (e.g. `./constants.js`). Teach
    // webpack to resolve those to the real `.ts`/`.tsx` sources.
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    };
    return config;
  },
};

export default nextConfig;
