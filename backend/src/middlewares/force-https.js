"use strict";

const config = require("../../config");

module.exports = function forceHttps(req, res, next) {
  if (config.forceHttp === true && req.headers["x-forwarded-proto"] === "https") {
    res.header("location", `http://${req.headers.host}${req.originalUrl}`);
    res.sendStatus(302);
  } else if (config.forceHttps === true && req.headers["x-forwarded-proto"] === "http") {
    res.header("location", `https://${req.headers.host}${req.originalUrl}`);
    res.sendStatus(302);
  } else {
    next();
  }
};
