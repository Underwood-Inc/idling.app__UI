/** @type {import('next').NextConfig} */
const nextConfig = {
  // webpack5: true,
  reactStrictMode: true,
  webpack: (config, { isServer, webpack }) => {
    // if (!isServer) {
    //   config.node = {
    //     fs: 'empty'
    //   };
    // }

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
  // experimental: {
  //   serverComponentsExternalPackages: ['pg']
  // }
};

module.exports = nextConfig;
