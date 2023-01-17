/* @flow */

const path = require("path");
const fs = require("fs");
const express = require("express");
const serveStatic = require("serve-static");
const serveFavicon = require("serve-favicon");
const compression = require("compression");
const cors = require("cors");
const config = require("./src/config");
const morgan = require("morgan");
const {forceHttps, secureHeaders} = require("./middlewares");
const dist = `${__dirname}/dist`;
// Get the NODE_ENV & DEV_MODE from the ENV
const NODE_ENV = process.env.NODE_ENV || "development";
const DEV_MODE = NODE_ENV === "development";

const appPaths = [
  "/",
  "/charts",
  "/analytics/:tab",
  "/disclaimer",
  "/backtest",
  "/subscribe",
];

module.exports = function createServer(app/*: any */ = express()) {
  if (DEV_MODE) {
    app.use(morgan(config.debug? "dev":"combined"));
  }
  if (config.forceHttps) {
    app.use(forceHttps);
  }
  app.use(cors());
  // Security measures
  app.disable("x-powered-by");
  app.use(secureHeaders());
  // favicon
  app.use(serveFavicon(
    path.join(__dirname, `public/staticimages/icons/favicon.ico`)
  ));
  // Production parts (not handled by webpack or optimizations)
  if (!DEV_MODE) {
    // GZIP everything!
    app.use(compression());
    // Serve up dist folder for production (in dev, webpack will handle that)
    app.use(serveStatic(path.join(__dirname, "dist"), {
      extensions: ["html", "htm"],
      index: ["index.html", "index.htm"],
    }));
    app.get(appPaths, function(req, res, next) {
      fs.readFile(`${dist}/index.html`, function (err,html) {
        res.writeHead(200, {
          "Content-Length": Buffer.byteLength(html),
          "Content-Type": "text/html",
        });
        res.write(html);
        res.end();
      });
    });
  }

  //locales (translations)
  app.use("/locales", serveStatic(path.join(__dirname, "locales"), {
    extensions: ["json"],
    index: false,
    fallthrough: false,
  }));

  //Add 404 catcher in prod
  if (!DEV_MODE) {
    app.use(function(req, res) {
      res.status(404).send("Sorry cant find that!");
    });
  }

  return app;
};
