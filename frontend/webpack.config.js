const fs = require("fs");
const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const AddAssetHtmlPlugin = require("add-asset-html-webpack-plugin");

const appConfig = require("./src/config");
const packageConfig = require("./package.json");
const babelConfig = JSON.parse(
  fs.readFileSync(path.join(__dirname, ".babelrc")).toString()
);
// Get the NODE_ENV & DEV_MODE from the ENV
const NODE_ENV = process.env.NODE_ENV || "development";
const DEV_MODE = NODE_ENV === "development";
const APP_PATH = process.env.APP_PATH || "/app";
const ANALYSE_BUNDLE = process.env.ANALYSE_BUNDLE;
// List all env variables that can be extracted and added to the bundle
// We do that in order to avoid importing private env variables from the dev's machine
const SUPPORTED_ENV = [
  "NODE_ENV",
  "DEBUG",
  "SUPPORTED_LANGUAGES",
  "PORT",
  "API_URL",
  "APP_URL",
  "APP_PATH",
  "APP_NAME",
  "GRAPHQL_PATH",
  "DEFAULT_LANGUAGE",
  "FORCE_HTTPS",
  "MAINTENANCE",
  "MOVEDAILY_TIMEFRAMES",
  "MOVEDAILY_DISPLAYED_TIMEFRAMES",
  "MOVEDAILY_CHOICES_TIMEFRAMES",
  "BTC_CHOICES_TIMEFRAMES",
  "SHOW_BTC_DATA",
  "SHOW_BACKTESTING",
];

// This is the common configuration for HTML templates
// Each template will then receive its own configuration
const commonHTMLConfig = {
  config: appConfig,
  version: packageConfig.version,
  minify: !DEV_MODE ? {
    collapseWhitespace: true,
    preserveLineBreaks: false,
    minifyJS: true,
    minifyCss: true,
    removeComments: true,
  } : false,
  hash: !DEV_MODE,
  showErrors: DEV_MODE,
};

// Webpack root
module.exports = {
  entry: {
    // Load styles at boot
    boot: ["./sass/main.scss"],
    // Application's entry point, contains all of the React app
    // landing: ["whatwg-fetch", "./src/landing/index.js"],
    app: ["whatwg-fetch", "./src/index.js"],
    // login: ["whatwg-fetch", "./src/login/index.js"],
  },
  // Output files are dist/*.bundle.js
  output: {
    filename: "assets/[name].[hash].bundle.js",
    path: path.join(__dirname, "dist"),
    publicPath: "/",
  },
  // Module loading is done here
  module: {
    // Setup source code loading rules
    rules: [
      // Babel transpiles ES2016 code to ES5
      {
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components|dist)/,
        use: [
          {
            loader: "babel-loader",
            // Change es2015 preset to give webpack access to ES6 modules support
            options: Object.assign({}, babelConfig, {
              presets: babelConfig.presets.map(preset => (
                preset === "es2015" ?
                  ["es2015", {modules: false}] :
                  preset
              )),
            }),
          },
        ],
      },
      {
        test: /\.s(a|c)ss$/,
        use: [
          { loader: "style-loader" },
          { loader: "css-loader" },
          { loader: "postcss-loader" },
          {
            loader: "sass-loader",
          },
        ],
      },
      // Images should be compressed
      {
        test: /\.(png|jpe?g|gif|svg)$/,
        use: [
          {
            loader: "file-loader",
            options: {
              hash: "sha12",
              digest: "hex",
              name: "assets/images/[name].[hash].[ext]",
            },
          },
          //turn off compression while ther is a vuln in the package.
          // {
          //   loader: "image-webpack-loader",
          //   query: {
          //     optipng: {
          //       optimizationLevel: 7,
          //       bypassOnDebug: true,
          //     },
          //     gifsicle: {
          //       interlaced: false,
          //       bypassOnDebug: true,
          //     },
          //   },
          // },
        ],
      },
      // Load fonts by just file-referencing them
      {
        test: /\.(ttf|eot|woff|woff2)$/,
        rules: [
          {
            loader: "file-loader",
            query: {
              name: "assets/fonts/[name].[hash].[ext]",
            },
          },
        ],
      },
      {
        test: /\.(graphql|gql)$/,
        exclude: /node_modules/,
        loader: "graphql-tag/loader",
      },
    ],
  },
  // Plugins refactors the complete bundles
  plugins: (
    /*!DEV_MODE ? [
      // In production apply some important optimizations
      new webpack.optimize.OccurrenceOrderPlugin(true),
      new webpack.DllReferencePlugin({
        context: __dirname,
        manifest: require("./dist/modules.json"),
      }),
      new webpack.DllReferencePlugin({
        context: __dirname,
        manifest: require("./dist/react.json"),
      }),
      new webpack.DllReferencePlugin({
        context: __dirname,
        manifest: require("./dist/redux.json"),
      }),
      new webpack.DllReferencePlugin({
        context: __dirname,
        manifest: require("./dist/apollo.json"),
      }),
      new webpack.DllReferencePlugin({
        context: __dirname,
        manifest: require("./dist/styling.json"),
      }),
    ] :*/ []
  )
  .concat(
    ANALYSE_BUNDLE ? [
      new BundleAnalyzerPlugin(),
    ] : []
  )
  .concat([
    // Inject authorized (see before) env variables in the code
    new webpack.DefinePlugin({
      __DEV__: process.env.NODE_ENV === "development" ? "true" : "false",
      process: {
        env: SUPPORTED_ENV.reduce((acc, envKey) => (process.env[envKey] ? Object.assign(acc, {
          [envKey]: `"${(process.env[envKey] || "").replace(/"/g, '\\"')}"`,
        }) : acc), {}),
      },
    }),
    // Compile static HTML pages:
    // 2. The landing page
    // new HtmlWebpackPlugin(Object.assign({
    //   filename: "index.html",
    //   template: "ejs-compiled-loader!./static/index.ejs",
    //   page: "/",
    //   chunks: ["boot", "landing"],
    // }, commonHTMLConfig)),
    // 2. The app entry
    new HtmlWebpackPlugin(Object.assign({
      filename: "index.html",
      template: "ejs-compiled-loader!./static/app.ejs",
      page: APP_PATH,
      chunks: ["boot", "app"],
    }, commonHTMLConfig)),
    // 3. The login menu/forms
    // new HtmlWebpackPlugin(Object.assign({
    //   inject: "head",
    //   filename: "login.html",
    //   template: "ejs-compiled-loader!./static/login.ejs",
    //   page: "/login",
    //   chunks: ["boot", "login"],
    // }, commonHTMLConfig)),

    // Copy the public directory in dist
    new CopyWebpackPlugin([
      {from: "public", force: true},
      {from: "src/tradingview/charting_library", to: "charting_library", force: true},
    ]),
  ]).concat(/*!DEV_MODE ? [
    new AddAssetHtmlPlugin({
      filepath: path.resolve("./dist/*.dll.js"),
      files: ["app.html"],
      includeSourcemap: false,
      hash: true,
      publicPath: "/",
      outputPath: "dist/",
    }),
  ] :*/ []),
  // Define sourcemaps mode if developing
  devtool: DEV_MODE ? "cheap-module-eval-source-map" : undefined,
  // hot-loader: fix react-hot-dom not detected
  resolve: {
    alias: {
      "react-dom": DEV_MODE ? "@hot-loader/react-dom" : "react-dom",
    }
  },
  // Enable cache for faster incremental builds
  cache: true,
  node: {
    fs: "empty",
  },
};
