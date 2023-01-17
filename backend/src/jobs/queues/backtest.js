"use strict";

const Queue = require("bull");
const config = require("../../../config");
const path = require("path");

module.exports.createBacktestQueue = () => {
  console.info("creating Backtest queue");
  const backtestQueue = new Queue("backtestQueue", config.redis.url, {
    defaultJobOptions: {
      removeOnComplete: true,
      removeOnFail: true,
    },
  });
  backtestQueue.on("error", function(error) {
    console.error(error);
  });
  backtestQueue.process("*",path.join(__dirname, "..", "runBacktest.js"));
  return backtestQueue;
};

module.exports.initBacktestQueue = (backtestQueue) => {
  return backtestQueue && backtestQueue.resume();
};
