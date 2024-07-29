/** @type {import('next').NextConfig} */
const nextConfig = {
  // webpack5: true,
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // if (!isServer) {
    //   config.node = {
    //     fs: 'empty'
    //   };
    // }
    config.resolve.fallback = {
      fs: false,
      path: false,
      stream: false,
      dns: false,
      net: false,
      'pg-native': false,
      crypto: false,
      tls: false
    };

    return config;
  }
  // experimental: {
  //   serverComponentsExternalPackages: ['pg']
  // }
};

module.exports = nextConfig;
