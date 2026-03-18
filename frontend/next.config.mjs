/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

  // Turbopack exclusions — this is what Next.js 16 actually uses
  // Stubs out Node.js-only packages pulled in by @hashgraph/hedera-wallet-connect
  turbopack: {
    resolveAlias: {
      'pino': 'pino/browser',
      'thread-stream': './empty-module.js',
      'pino-pretty': './empty-module.js',
      'sonic-boom': './empty-module.js',
      'on-exit-leak-free': './empty-module.js',
      'pino-abstract-transport': './empty-module.js',
      'real-require': './empty-module.js',
    },
  },

  // Webpack fallback for local dev
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        worker_threads: false,
      };
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : []),
        'pino',
        'pino-pretty',
        'thread-stream',
      ];
    }
    return config;
  },
}

export default nextConfig
