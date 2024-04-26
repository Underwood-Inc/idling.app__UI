module.exports = {
  plugins: ["typescript"],
  options: {
    verbose: true, // set to true to get more info/error output
    debug: {
      // debug flags
      options: false, // print webpackOptions that will be used in webpack config
      config: false, // print webpack config
      nodeExternals: false, // print node externals debug info
    },
    // buildType: "iso", // or 'spa', 'serveronly', 'iso-serverless' and 'serveronly-serverless'
    // cssPrefix: "static/css",
    // jsPrefix: "static/js",
    // mediaPrefix: "static/media",
    // staticCssInDev: false, // static css in development build (incompatible with css hot reloading)
    // enableSourceMaps: true,
    // enableReactRefresh: false,
    // enableTargetBabelrc: true, // enable to use .babelrc.node and .babelrc.web
    // enableBabelCache: true,
    // forceRuntimeEnvVars: [], // force env vars to be read from env e.g. ['HOST', 'PORT']
    // disableWebpackbar: false, // can be true to disable all environments or target to disable specific environment such as "node" or "web"
    // staticExport: {
    //   parallel: 5, // how many pages to render at a time
    //   routesExport: "routes",
    //   renderExport: "render",
    //   scriptInline: false,
    //   windowRoutesVariable: "RAZZLE_STATIC_ROUTES",
    //   windowRoutesDataVariable: "RAZZLE_STATIC_DATA_ROUTES",
    // },
  },
};
