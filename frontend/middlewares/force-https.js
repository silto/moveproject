"use strict";

module.exports = function forceHttps(req, res, next) {
  if (req.headers["x-forwarded-proto"] === "http") {
    res.header("location", `https://${req.headers.host}${req.originalUrl}`);
    res.sendStatus(302);
  } else {
    next();
  }
};
