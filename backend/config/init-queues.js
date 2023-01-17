"use strict";

const Queue = require("bull");
const config = require("./index");

let backtestQueue;

const getBacktestQueue = () => {
  if (backtestQueue) {
    return backtestQueue;
  }
  backtestQueue = new Queue("backtestQueue", config.redis.url, {
    defaultJobOptions: {
      removeOnComplete: true,
      removeOnFail: true,
    },
  });
  return backtestQueue;
};
module.exports.getBacktestQueue = getBacktestQueue;

let moveQueue;

const getMoveQueue = () => {
  if (moveQueue) {
    return moveQueue;
  }
  moveQueue = new Queue("moveQueue", config.redis.url);
  return moveQueue;
};
module.exports.getMoveQueue = getMoveQueue;
