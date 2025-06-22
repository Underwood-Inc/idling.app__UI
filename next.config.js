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

      // Enhanced code obfuscation and optimization
      if (config.optimization.minimizer) {
        config.optimization.minimizer.forEach((minimizer) => {
          if (minimizer.constructor.name === 'TerserPlugin') {
            minimizer.options.terserOptions = {
              ...minimizer.options.terserOptions,
              compress: {
                ...minimizer.options.terserOptions?.compress,
                // Remove console statements
                drop_console: true,
                drop_debugger: true,
                // Advanced compression options
                passes: 3, // Multiple compression passes
                unsafe: true,
                unsafe_comps: true,
                unsafe_Function: true,
                unsafe_math: true,
                unsafe_symbols: true,
                unsafe_methods: true,
                unsafe_proto: true,
                unsafe_regexp: true,
                unsafe_undefined: true,
                // Remove dead code
                dead_code: true,
                // Inline functions
                inline: 3,
                // Remove unused variables
                unused: true,
                // Evaluate constant expressions
                evaluate: true,
                // Collapse single-use variables
                collapse_vars: true,
                // Reduce variables
                reduce_vars: true,
                // Join consecutive variable declarations
                join_vars: true,
                // Remove empty statements
                sequences: true,
                // Remove pure functions
                pure_funcs: [
                  'console.log',
                  'console.info',
                  'console.warn',
                  'console.error',
                  'console.debug',
                  'console.trace',
                  'console.group',
                  'console.groupCollapsed',
                  'console.groupEnd'
                ]
              },
              mangle: {
                ...minimizer.options.terserOptions?.mangle,
                // Mangle property names for better obfuscation
                properties: {
                  regex: /^_/, // Only mangle properties starting with underscore
                  reserved: ['__typename', '__esModule'] // Preserve these
                },
                // Mangle top-level names
                toplevel: true,
                // Keep function names for debugging (set to false for max obfuscation)
                keep_fnames: false,
                // Keep class names for debugging (set to false for max obfuscation)
                keep_classnames: false,
                // Use shorter variable names
                safari10: true
              },
              format: {
                ...minimizer.options.terserOptions?.format,
                // Remove comments
                comments: false,
                // Use ASCII only
                ascii_only: true,
                // Remove whitespace
                beautify: false,
                // Use shortest possible syntax
                ecma: 2020
              }
            };
          }
        });
      }

      // Enhanced chunking strategy for better obfuscation
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          cacheGroups: {
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
              name: (module, chunks, cacheGroupKey) => {
                // Generate hashed name for default chunks
                const hash = require('crypto')
                  .createHash('md5')
                  .update(chunks.map((c) => c.name).join())
                  .digest('hex')
                  .substring(0, 8);
                return `${cacheGroupKey}-${hash}`;
              }
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              priority: -10,
              chunks: 'all',
              reuseExistingChunk: true,
              name: (module, chunks, cacheGroupKey) => {
                // Generate hashed name for vendor chunks
                const hash = require('crypto')
                  .createHash('md5')
                  .update(chunks.map((c) => c.name).join())
                  .digest('hex')
                  .substring(0, 8);
                return `vendor-${hash}`;
              }
            },
            common: {
              minChunks: 2,
              priority: -5,
              chunks: 'all',
              reuseExistingChunk: true,
              name: (module, chunks, cacheGroupKey) => {
                // Generate hashed name for common chunks
                const hash = require('crypto')
                  .createHash('md5')
                  .update(chunks.map((c) => c.name).join())
                  .digest('hex')
                  .substring(0, 8);
                return `common-${hash}`;
              }
            }
          }
        },
        // Use deterministic IDs but let Next.js handle the specifics
        moduleIds: 'deterministic',
        chunkIds: 'deterministic'
      };

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

      // Add banner to obfuscated files to deter reverse engineering
      config.plugins.push(
        new webpack.BannerPlugin({
          banner: `/*! Idling.app v${version} - Proprietary Software - Unauthorized copying, modification, or distribution is strictly prohibited */`,
          raw: false,
          entryOnly: false
        })
      );

      // Remove source maps in production for security
      config.devtool = false;

      // Enhanced obfuscation: use hashed chunk names while maintaining compatibility
      if (!isServer) {
        config.output = {
          ...config.output,
          chunkFilename: 'static/chunks/[contenthash:16].js'
        };
      }

      // Add additional minification for CSS
      if (config.optimization.minimizer) {
        // Find CSS minimizer and enhance it
        config.optimization.minimizer.forEach((minimizer) => {
          if (minimizer.constructor.name === 'CssMinimizerPlugin') {
            minimizer.options = {
              ...minimizer.options,
              minimizerOptions: {
                ...minimizer.options?.minimizerOptions,
                preset: [
                  'default',
                  {
                    discardComments: { removeAll: true },
                    normalizeWhitespace: true,
                    colormin: true,
                    convertValues: true,
                    discardDuplicates: true,
                    discardEmpty: true,
                    discardOverridden: true,
                    discardUnused: true,
                    mergeIdents: true,
                    mergeLonghand: true,
                    mergeRules: true,
                    minifyFontValues: true,
                    minifyGradients: true,
                    minifyParams: true,
                    minifySelectors: true,
                    normalizeCharset: true,
                    normalizeDisplayValues: true,
                    normalizePositions: true,
                    normalizeRepeatStyle: true,
                    normalizeString: true,
                    normalizeTimingFunctions: true,
                    normalizeUnicode: true,
                    normalizeUrl: true,
                    orderedValues: true,
                    reduceIdents: true,
                    reduceInitial: true,
                    reduceTransforms: true,
                    svgo: true,
                    uniqueSelectors: true
                  }
                ]
              }
            };
          }
        });
      }
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
