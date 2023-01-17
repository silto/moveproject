"use strict";

const Queue = require("bull");
const config = require("../../../config");
const path = require("path");
const { moveCron } = require("../../utils/cronGenerator");
const moment = require("moment");

module.exports.createMoveQueue = () => {
  console.info("creating Move queue");
  const moveQueue = new Queue("moveQueue", config.redis.url);
  moveQueue.on("error", function(error) {
    console.error(error);
  });
  moveQueue.process("*",path.join(__dirname, "..", "getMove.js"));
  return moveQueue;
};

module.exports.initMoveQueue = (moveQueue) => {
  moveQueue.getRepeatableJobs()
  .then(jobs => {
    let expectedJobKeys = [];
    if (!config.jobs.moveDaily.chainWithBTCQueue || !config.jobs.btc.enabled) {
      expectedJobKeys.push(`daily:::UTC:${moveCron("d")}`);
    }
    let alreadyRegisteredJobs = {};
    let removeList = [];
    jobs.forEach(job => {
      if (!expectedJobKeys.some(key => key === job.key)) {
        console.info(`will remove ${job.key}`);
        removeList.push(moveQueue.removeRepeatableByKey(job.key));
      } else {
        alreadyRegisteredJobs[job.key] = job;
      }
    });
    Promise.all(removeList)
    .then(() => moveQueue.resume())
    .then(() => {
      if (config.jobs.moveDaily.chainWithBTCQueue && config.jobs.btc.enabled) {
        console.info("move job is chained with btc job, not scheduling");
        return;
      }
      if (alreadyRegisteredJobs[`daily:::UTC:${moveCron("d")}`]) {
        console.info("job for daily already scheduled");
        let alreadyRegisteredDaily = alreadyRegisteredJobs[`daily:::UTC:${moveCron("d")}`];
        let nextDate = moment(alreadyRegisteredDaily.next);
        const nowPlusMargin = moment().add(1,"m");
        if (nextDate.isBefore(nowPlusMargin)) {
          console.info(`scheduled in the past: ${nextDate.toISOString()}`);
          moveQueue.removeRepeatableByKey(alreadyRegisteredDaily.key)
          .then(() => {
            console.info("removed outdated job");
            console.info("adding catch up job");
            moveQueue.add("dailyCatchup", {});
            console.info("adding job for daily");
            moveQueue.add("daily", {}, {repeat: {cron: moveCron("d"), tz: "UTC"}})
            .catch(err => {
              console.error("error with the daily job");
              console.error(err);
            });
          });
        }
      } else {
        console.info("job for daily not scheduled yet, adding it");
        moveQueue.add("daily", {}, {repeat: {cron: moveCron("d"), tz: "UTC"}})
        .catch(err => {
          console.error("error with the daily job");
          console.error(err);
        });
      }
    });
  });
};
