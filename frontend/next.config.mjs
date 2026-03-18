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
      'pino': { browser: 'pino/browser' },
      'thread-stream': { browser: false },
      'pino-pretty': { browser: false },
      'sonic-boom': { browser: false },
      'on-exit-leak-free': { browser: false },
      'pino-abstract-transport': { browser: false },
      'real-require': { browser: false },
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
        'thread-stream': false,
        'pino-pretty': false,
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
