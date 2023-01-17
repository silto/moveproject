"use strict";
/* eslint camelcase: 0 */
const url = require("url");
const redis = require("redis");
const { RateLimiterRedis } = require("rate-limiter-flexible");
const config = require("../../config");
const redisUrl = url.parse(config.session.url);
const redisCredentials = (redisUrl.auth || "").split(":")[1];

const redisClient = redis.createClient({
  host: redisUrl.hostname,
  port: redisUrl.port,
  db: 0,
  auth_pass: redisCredentials,
  enable_offline_queue: false,
});

module.exports.backtestLimiterByIp = () => new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "backtest_limit_ip",
  points: config.rateLimits.backtest.ip.points,
  duration: 60 * 60 * config.rateLimits.backtest.ip.duration,
  blockDuration: 60 * 60 * config.rateLimits.backtest.ip.blockDuration,
});
