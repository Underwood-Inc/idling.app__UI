const { version } = require('./package.json');

/** @type {import('next').NextConfig} */
const nextConfig = {
  publicRuntimeConfig: {
    version
  },
  reactStrictMode: true,
  // Smart caching with version-based cache busting
  experimental: {
    staleTimes: {
      dynamic: 30, // 30 seconds for dynamic content
      static: 300 // 5 minutes for static content
    }
  },
  // Smart cache headers with versioning
  async headers() {
    return [
      // Static assets with long cache + version busting
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable' // 1 year for static assets
          }
        ]
      },
      // Favicon and common static files
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      // Image files
      {
        source: '/:path*.(png|jpg|jpeg|gif|svg|ico|webp)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800' // 7 days for images
          }
        ]
      },
      // API routes with short cache
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, s-maxage=60, stale-while-revalidate=300' // 1 min cache, 5 min stale
          },
          {
            key: 'X-App-Version',
            value: version
          }
        ]
      },
      // Dynamic pages with short cache + version header
      {
        source: '/((?!_next|api|favicon).*)',
        headers: [
          {
            key: 'Cache-Control',
            value:
              'public, max-age=300, s-maxage=300, stale-while-revalidate=600' // 5 min cache, 10 min stale
          },
          {
            key: 'X-App-Version',
            value: version
          },
          {
            key: 'Vary',
            value: 'Accept-Encoding, X-App-Version'
          }
        ]
      }
    ];
  },
  // Add build ID for cache busting
  generateBuildId: async () => {
    // Use version + timestamp for unique build IDs
    return `${version}-${Date.now()}`;
  },
  webpack: (config, { webpack, dev, isServer }) => {
    // In production builds, exclude dev tools entirely
    if (!dev) {
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^.*\/dev-tools\/.*$/,
          contextRegExp: /src\/app\/components/
        })
      );

      // Remove console statements in production
      if (config.optimization.minimizer) {
        config.optimization.minimizer.forEach((minimizer) => {
          if (minimizer.constructor.name === 'TerserPlugin') {
            minimizer.options.terserOptions = {
              ...minimizer.options.terserOptions,
              compress: {
                ...minimizer.options.terserOptions?.compress,
                drop_console: true,
                drop_debugger: true,
                pure_funcs: [
                  'console.log',
                  'console.info',
                  'console.warn',
                  'console.error',
                  'console.debug',
                  'console.trace'
                ]
              }
            };
          }
        });
      }

      // Add DefinePlugin to replace console methods with no-ops in production
      config.plugins.push(
        new webpack.DefinePlugin({
          'console.log': JSON.stringify(() => {}),
          'console.info': JSON.stringify(() => {}),
          'console.warn': JSON.stringify(() => {}),
          'console.error': JSON.stringify(() => {}),
          'console.debug': JSON.stringify(() => {}),
          'console.trace': JSON.stringify(() => {}),
          'console.group': JSON.stringify(() => {}),
          'console.groupCollapsed': JSON.stringify(() => {}),
          'console.groupEnd': JSON.stringify(() => {})
        })
      );
    }

    config.plugins.push(
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer']
      })
    );
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/node:/, (resource) => {
        resource.request = resource.request.replace(/^node:/, '');
      })
    );
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^pg-native$|^cloudflare:sockets$/
      })
    );

    config.resolve.fallback = {
      fs: false,
      path: false,
      dns: false,
      net: false,
      'pg-native': false,
      crypto: false,
      tls: false,
      buffer: require.resolve('buffer/'),
      stream: require.resolve('stream-browserify')
    };

    return config;
  }
};

module.exports = nextConfig;
