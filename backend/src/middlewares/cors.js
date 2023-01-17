"use strict";

const config = require("../../config");


const allowedOrigin = function(reqOrigin, callback) {
  let isAllowedOrigin = Object.keys(config.baseUrls).some(function testOrigin(origin) {
    return config.baseUrls[origin].indexOf(reqOrigin) > -1;
  });
  return callback(null,isAllowedOrigin);
};

const corsOptions = {
  origin: allowedOrigin,
  methods: "GET,POST,PUT,DELETE,OPTIONS,HEAD,PATCH",
  allowedHeaders: "X-Requested-With,X-HTTP-Method-Override,If-Modified-Since,Content-Type,Content-Length,Cache-Control,X-Safari-Origin,Range,If-None-Match,X-gql-Lang",
  exposedHeaders: "X-Requested-With,X-HTTP-Method-Override,Content-Range,Content-Type,Content-Length,Cache-Control",
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

module.exports = corsOptions;
