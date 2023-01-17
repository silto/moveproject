"use strict";

const config = require("../../config");
const mailHelpers = require("../lib/mail-helpers");
//pre-load all mongoose and connect to mongodb
require("../shared/models")(config, { mail: mailHelpers});
const mongooseInit = require("../../config/init-conns");
let mongooseInitialized = false;
const { getBacktestQueue, getMoveQueue } = require("../../config/init-queues");

const {completeBTCFromAPI} = require("../routines");

module.exports = async () => {
  if (!mongooseInitialized) {
    mongooseInitialized = await mongooseInit();
  }
  console.info(`getting BTC data`);
  if (!config.jobs.btc.enabled) {
    console.info(`BTC job disabled, skipping`);
    return Promise.resolve();
  }
  let backtestPauseProm;
  const backtestQueue = getBacktestQueue();
  let moveQueue;
  if (config.jobs.moveDaily.chainWithBTCQueue) {
    moveQueue = getMoveQueue();
  }
  const resumeBacktest = () => {
    console.info("resuming backtest queue");
    backtestQueue && backtestQueue.resume();
  };
  if (backtestQueue) {
    backtestPauseProm = backtestQueue.pause();
  } else {
    backtestPauseProm = Promise.resolve();
  }
  console.info("pausing backtest queue to avoid conflicts");
  return backtestPauseProm
  .then(() => {
    console.info("backtest queue paused");
    return completeBTCFromAPI(config.jobs.btc)
    .then(() => {
      if (config.jobs.moveDaily.chainWithBTCQueue) {
        moveQueue.add("daily", {});
      } else {
        resumeBacktest();
      }
    })
    .catch((err) => {
      if (config.jobs.moveDaily.chainWithBTCQueue) {
        moveQueue.add("daily", {});
      } else {
        resumeBacktest();
      }
      return Promise.reject(err);
    });
  });
};
