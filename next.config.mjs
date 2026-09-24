/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    serverComponentsExternalPackages: ['ccxt', 'node:sqlite'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('node:sqlite');
    }
    return config;
  },
};

export default nextConfig;
