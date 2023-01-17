/* eslint-disable no-console */
const moment = require("moment");
const mongoose = require("mongoose");
const BTCOHLC = mongoose.model("BTCOHLC");
const config = require("../../config");
const btcApiInterface = require("../interface")[config.jobs.btc.priceDataInterface || config.priceDataInterface];
const btcApiInterfaceConfig = config.interfacesConfig[config.jobs.btc.priceDataInterface || config.priceDataInterface];
const {
  getLastBTCCandle,
  createSyntheticTimeframes,
} = require("../utils/btcUtils");

const safetyPeriod = 180;
const remapOHLC = (ohlc) => ({
  exchange: "FTX",
  timestamp: ohlc.timestamp,
  timeframe: "1m",
  date: new Date(ohlc.timestamp*1000),
  open: ohlc.open,
  high: ohlc.high,
  low: ohlc.low,
  close: ohlc.close,
  volume: ohlc.volume,
});

const BATCH_CANDLE_NUM = 121;
const BATCH_TIME = 60 * BATCH_CANDLE_NUM;

const reconstructOhlc = (ohlcData, after, before, lastCandleTmp) => {
  console.info("reconstructing");
  let lastCandle = lastCandleTmp;
  let timestamp = after;
  let reconstructed = [];
  while (timestamp <= before) {
    // eslint-disable-next-line no-loop-func
    let existingOhlc = ohlcData.find(ohlc => ohlc.timestamp === timestamp);
    if (existingOhlc) {
      console.info(`using existing candle at time ${moment.utc(timestamp*1000).toDate().toUTCString()}`);
      reconstructed.push(existingOhlc);
      lastCandle = existingOhlc;
    } else {
      console.info(`reconstructing candle at time ${moment.utc(timestamp*1000).toDate().toUTCString()}`);
      reconstructed.push({
        timestamp: timestamp,
        date: moment.utc(timestamp*1000).toDate(),
        open: lastCandle.close,
        high: lastCandle.close,
        low: lastCandle.close,
        close: lastCandle.close,
        volume: 0,
      });
    }
    timestamp += 60;
  }
  return reconstructed;
};

async function save1mcandles(jobConfig, lastCandleTmp) {
  let lastCandle = lastCandleTmp;
  const {maxTimestamp} = jobConfig;
  let lastTimestamp = parseInt(maxTimestamp);
  let firstIteration = true;
  if (lastCandle && lastCandle.timestamp && lastCandle.timestamp > lastTimestamp) {
    lastTimestamp = lastCandle.timestamp;
    firstIteration = false;
  }
  const nowTimestamp = moment().unix();
  console.log(`last 1m BTC timestamp in db ${lastTimestamp}`);
  if (lastTimestamp + safetyPeriod >= nowTimestamp) {
    console.log(`update of BTC data is too recent, skipping`);
    return lastTimestamp;
  }
  console.log(`will update BTC 1m data`);
  let ohlcData, ohlcBatch, after, before;
  let notDone = true;

  while (notDone) {
    after = lastTimestamp + 60;
    if (firstIteration) {
      after = after - 60;
    }
    if (after > nowTimestamp) {
      return lastTimestamp;
    }
    before = lastTimestamp + BATCH_TIME;
    if (before + safetyPeriod > nowTimestamp) {
      notDone = false;
      before = (nowTimestamp - nowTimestamp % 60) - safetyPeriod;
    }
    try {
      ohlcData = await btcApiInterface.market.getOHLC(`BTC/USD`, {
        period: "1m",
        after,
        before,
      }, btcApiInterfaceConfig);
    } catch (e) {
      console.error(e);
      return new Error("error fetching btc data");
    }

    firstIteration = false;
    if (ohlcData.length < ((before - after) / 60) + 1) {
      console.info("\n\n\nALERT ALERT ALERT\n\n\n");
      ohlcData = reconstructOhlc(ohlcData, after, before, lastCandle);
    }
    let truncatedNewData = ohlcData.slice(0,ohlcData.length - 1);// remove the last candle in case it's incomplete
    if (truncatedNewData.length > 0) {
      ohlcBatch = truncatedNewData.map(remapOHLC);
      if (ohlcBatch.length > 0) {
        const saveResult = await BTCOHLC.insertMany(ohlcBatch, {
          limit: 300,
          rawResult: true,
        });
        console.info(`[${
          ohlcBatch[0].date.toUTCString()
        } - ${
          ohlcBatch[ohlcBatch.length - 1].date.toUTCString()
        }] btc 1m ohlc in: ${ohlcBatch.length} | saved: ${saveResult.insertedCount}`);
        lastCandle = ohlcBatch[ohlcBatch.length - 1];
        lastTimestamp = lastCandle.timestamp;
      }
    }
  }
  return lastTimestamp;
}

module.exports = function(jobConfig) {
  return getLastBTCCandle("1m")
  .then(lastCandle =>
    save1mcandles(jobConfig, lastCandle)
    .then((last1mCandleTimestamp) => createSyntheticTimeframes(jobConfig, last1mCandleTimestamp))
    .then(() => {
      console.log("complete from API done");
    })
    .catch(console.error)
  );
};
