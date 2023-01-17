"use strict";

const Queue = require("bull");
const config = require("../../../config");
const path = require("path");
const { btcCron } = require("../../utils/cronGenerator");
const moment = require("moment");

module.exports.createBTCQueue = () => {
  console.info("creating BTC queue");
  const btcQueue = new Queue("btcQueue", config.redis.url);
  btcQueue.on("error", function(error) {
    console.error(error);
  });
  btcQueue.process("*",path.join(__dirname, "..", "getBTC.js"));
  return btcQueue;
};

module.exports.initBTCQueue = (btcQueue) => {
  const expectedJobKey = `btc:::UTC:${btcCron()}`;
  btcQueue.getRepeatableJobs()
  .then(jobs => {
    let alreadyRegisteredJob = null;
    let removeList = [];
    jobs.forEach(job => {
      if (job.key !== expectedJobKey) {
        console.info(`will remove ${job.key}`);
        removeList.push(btcQueue.removeRepeatableByKey(job.key));
      } else {
        alreadyRegisteredJob = job;
      }
    });
    Promise.all(removeList)
    .then(() => btcQueue.resume())
    .then(() => {
      if (alreadyRegisteredJob) {
        console.info("job for btc already scheduled");
        let nextDate = moment(alreadyRegisteredJob.next);
        const nowPlusMargin = moment().add(3,"m");
        if (nextDate.isBefore(nowPlusMargin)) {
          console.info(`scheduled in the past: ${nextDate.toISOString()}`);
          btcQueue.removeRepeatableByKey(alreadyRegisteredJob.key)
          .then(() => {
            console.info("removed outdated btc job");
            console.info("adding catch up btc job");
            btcQueue.add("btcCatchup", {});
            console.info("adding job for daily btc");
            btcQueue.add("btc", {}, {repeat: {cron: btcCron(), tz: "UTC"}})
            .catch(err => {
              console.error("error with the daily btc job");
              console.error(err);
            });
          });
        }
      } else {
        console.info("job for btc not scheduled yet, adding it");
        btcQueue.add("btc", {}, {repeat: {cron: btcCron(), tz: "UTC"}})
        .catch(err => {
          console.error("error with the daily btc job");
          console.error(err);
        });
      }
    });
  });
};
