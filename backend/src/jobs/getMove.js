"use strict";

const config = require("../../config");
const mailHelpers = require("../lib/mail-helpers");
//pre-load all mongoose and connect to mongodb
require("../shared/models")(config, { mail: mailHelpers});
const mongooseInit = require("../../config/init-conns");
let mongooseInitialized = false;
const { getBacktestQueue } = require("../../config/init-queues");

const {makeDbMove} = require("../routines");

module.exports = async (job) => {
  if (!mongooseInitialized) {
    mongooseInitialized = await mongooseInit();
  }
  //TODO if un signal est déjà en db dans les timeIntervalToWatch jours précédents, ne pas chercher
  console.info(`getting data for MOVE ${job.name} timeframe`);
  let backtestPauseProm;
  const backtestQueue = getBacktestQueue();
  const resumeBacktest = () => {
    console.info("resuming backtest queue");
    backtestQueue && backtestQueue.resume();
  };
  if (backtestQueue) {
    backtestPauseProm = backtestQueue.pause();
  } else {
    backtestPauseProm = Promise.resolve();
  }
  // only handle "daily" timeframe right now
  // TODO handle other timeframes
  console.info("pausing backtest queue to avoid conflicts");
  return backtestPauseProm
  .then(() => {
    console.info("backtest queue paused");
    return makeDbMove("daily", Object.assign({}, {
      skipIfAlreadyInDb: false, // only get the last contracts, db should already be initialized
    }, config.jobs.moveDaily))
    .then(() => {
      resumeBacktest();
    })
    .catch((err) => {
      resumeBacktest();
      return Promise.reject(err);
    });
  });
};
