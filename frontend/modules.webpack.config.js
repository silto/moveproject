
const webpack = require("webpack");
const path = require("path");

// Get the NODE_ENV & DEV_MODE from the ENV
const outputPath =  path.join(__dirname, "dist");

module.exports = {
  context: process.cwd(),
  entry: {
    react: [
      "react",
      "react-dom",
      "react-redux",
      "react-apollo",
    ],
    redux: [
      "redux",
      "redux-act",
      "redux-act-async",
      "redux-persist",
      "redux-persist-transform-immutable",
      "redux-thunk",
    ],
    apollo: [
      "apollo-client",
      "apollo-cache-inmemory",
      "apollo-link",
      "apollo-link-http",
      "graphql-tag",
      "apollo-utilities",
    ],
    styling: [
      "classnames",
    ],
    modules: [
      "immutable",
    ],
  },
  output: {
    filename: "[name].dll.js",
    path: outputPath,
    library: "[name]",
  },
  plugins: [
    new webpack.DllPlugin({
      name: "[name]",
      path: path.join(outputPath, "[name].json"),
    }),
  ],
};
