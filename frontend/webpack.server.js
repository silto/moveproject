const path = require("path");
const webpack = require("webpack");
const WebpackDevServer = require("webpack-dev-server");

const config = require("./webpack.config");
const createServer = require("./server");

// Get the PORT & HOST from the ENV
const HOST = process.env.HOST || "localhost";
const PORT = process.env.PORT || 7050;
// Get the NODE_ENV & DEV_MODE from the ENV
const NODE_ENV = process.env.NODE_ENV || "development";
const DEV_MODE = NODE_ENV === "development";
// const APP_PATH = process.env.APP_PATH || "/app";

// Patch the bundle with the hot reloading parts
// 1. Add hot code to the entry point
config.entry.app = (DEV_MODE ? [
  `webpack-dev-server/client?http://${HOST}:${PORT}`,
  "webpack/hot/only-dev-server",
  "react-hot-loader/patch",
] : []).concat(
  Array.isArray(config.entry.app)?config.entry.app: [config.entry.app],
);

// 2. Add hot plugin
config.plugins = [new webpack.HotModuleReplacementPlugin()].concat(config.plugins);
// 3. Configure this dev server!
config.devServer = {
  hot: DEV_MODE,
};
config.mode = NODE_ENV;
// Mount the webpack middleware for hot reloading
let webpackDevServer = new WebpackDevServer(webpack(config), {
  publicPath: config.output.publicPath,
  contentBase: path.resolve("dist"),
  hot: true,
  historyApiFallback: true,
  proxy: {
    // [APP_PATH]: {
    //   target: `http://${HOST}:${PORT}/app.html`,
    //   ignorePath: true,
    // },
    // "/login": {
    //   target: `http://${HOST}:${PORT}/login.html`,
    //   ignorePath: true,
    // },
  },
  before: createServer,
});

module.exports = webpackDevServer;
