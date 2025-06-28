const { version } = require('./package.json');

/** @type {import('next').NextConfig} */
const nextConfig = {
  publicRuntimeConfig: {
    version
  },
  reactStrictMode: true,
  eslint: {
    // Allow production builds to complete even if there are ESLint warnings
    ignoreDuringBuilds: true
  },
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
      // OG Image API - no caching for dynamic content
      {
        source: '/api/og-image',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate'
          },
          {
            key: 'Pragma',
            value: 'no-cache'
          },
          {
            key: 'Expires',
            value: '0'
          },
          {
            key: 'X-App-Version',
            value: version
          }
        ]
      },
      // API routes with short cache (excluding og-image)
      {
        source: '/api/((?!og-image).*)',
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
  // Use consistent build ID based on version only
  generateBuildId: async () => {
    // Use version for consistent build IDs across rebuilds
    return `${version.replace(/\./g, '-')}`;
  },
  webpack: (config, { webpack, dev }) => {
    // In production builds, exclude dev tools entirely
    if (!dev) {
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^.*\/dev-tools\/.*$/,
          contextRegExp: /src\/app\/components/
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

    // Only add fallbacks for specific modules that need them
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
