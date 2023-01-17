"use strict";

const { createMoveQueue, initMoveQueue } = require("./queues/move");
const { createBTCQueue, initBTCQueue } = require("./queues/btc");
const { createBacktestQueue, initBacktestQueue } = require("./queues/backtest");

const moveQueue = createMoveQueue();
const btcQueue = createBTCQueue();
const backtestQueue = createBacktestQueue();

let stopping = false;

const closeAllQueues = () => {
  console.info("Closing all queues");
  return moveQueue.close()
  .then(() => btcQueue.close())
  .then(() => backtestQueue.close())
  .then(() => console.info("Closed redis connections, exiting gracefully"));
};

process.on("SIGINT", () => {
  console.info("Got SIGINT");
  if (stopping === true) {
    console.info("Already stopping.");
    return;
  }
  stopping = true;
  setTimeout(() => {
    console.warn(`Couldn't stop all queues within 30s, sorry! Exiting.`);
    process.exit(1);
  }, 30000);

  closeAllQueues()
  .then(() => {
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  console.info("Got SIGTERM");
  if (stopping === true) {
    console.info("Already stopping.");
    return;
  }
  stopping = true;
  setTimeout(() => {
    console.warn(`Couldn't stop all queues within 30s, sorry! Exiting.`);
    process.exit(1);
  }, 30000);

  closeAllQueues()
  .then(() => {
    process.exit(0);
  });
});
initBacktestQueue(backtestQueue)
.then(() => {
  initMoveQueue(moveQueue);
  initBTCQueue(btcQueue);
});
