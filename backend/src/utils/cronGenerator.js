"use strict";

const config = require("../../config");

module.exports.moveCron = function(timeframe) {
  if (timeframe === "d") {
    // cron for the daily moves
    // expire every day at 00:00 UTC
    return `0 ${config.jobs.moveDaily.minute} ${config.jobs.moveDaily.hour} * * *`;
  } else if (timeframe === "w") {
    // expire every Friday to Saturday night at 00:00 UTC
    return `0 ${config.jobs.moveWeekly.minute} ${config.jobs.moveWeekly.hour} * * 6`;
  } else if (timeframe === "q") {
    // expire last Friday of every quarter at 03:00 UTC
    //!!! can't limit to last Friday of the month with cron, needs to add a test in the job
    return `0 ${config.jobs.moveQuarterly.minute} ${config.jobs.moveQuarterly.hour} * 3,6,9,12 5`;
  }
};

module.exports.btcCron = function() {
  return `0 ${config.jobs.btc.minute} ${config.jobs.btc.hour} * * *`;
};
