/* eslint-disable no-console */
const mongoose = require("mongoose");
const BTCOHLC = mongoose.model("BTCOHLC");
const {OHLC_TIMEFRAMES} = require("../utils/constants");

const getLastBTCCandle = module.exports.getLastBTCCandle = (timeframe) => {
  return BTCOHLC.find({
    timeframe,
  })
  .sort({date: -1})
  .limit(1)
  .exec()
  .then(docs => {
    if (!docs || docs.length === 0) {
      return null;
    }
    return docs[0];
  });
};

const getNBTCCandles = module.exports.getNBTCCandles = (timeframe, startTimestamp, n) => {
  return BTCOHLC.find({
    timeframe,
    date: {$gte: new Date(startTimestamp*1000)},
  })
  .sort({date: 1})
  .limit(n)
  .exec()
  .then(docs => {
    if (!docs) {
      return null;
    }
    return docs;
  });
};

async function createSyntheticTimeframes(config, last1mCandleTimestamp) {
  const {maxTimestamp, timeframes: tmfStr} = config;
  const startTimestamp = parseInt(maxTimestamp);
  const timeframes = tmfStr.split(",").slice(1);
  for (const timeframe of timeframes) {
    let startTFTimestamp = startTimestamp;
    const lastCandle = await getLastBTCCandle(timeframe);
    const timeframeTime = OHLC_TIMEFRAMES[timeframe];
    if (lastCandle) {
      startTFTimestamp = lastCandle.timestamp + timeframeTime;
    }
    let currentCandleTimestamp = startTFTimestamp;
    let ohlcBatch = [];
    while (currentCandleTimestamp + timeframeTime <= last1mCandleTimestamp + 60) {
      const candleNum = timeframeTime / 60;
      const candlesToAcc = await getNBTCCandles("1m", currentCandleTimestamp, candleNum);
      if (!candlesToAcc || candlesToAcc.length !== candleNum) {
        return Promise.reject("error: missing candles to accumulate");
      }
      const newCandle = {
        exchange: candlesToAcc[0].exchange,
        timestamp: currentCandleTimestamp,
        timeframe,
        date: new Date(currentCandleTimestamp*1000),
        open: candlesToAcc[0].open,
        high: candlesToAcc[0].high,
        low: candlesToAcc[0].low,
        close: candlesToAcc[candleNum - 1].close,
        volume: 0,
      };
      candlesToAcc.forEach((candle) => {
        if (candle.high > newCandle.high) {
          newCandle.high = candle.high;
        }
        if (candle.low < newCandle.low) {
          newCandle.low = candle.low;
        }
        newCandle.volume += candle.volume;
      });
      ohlcBatch.push(newCandle);
      if (ohlcBatch.length >= 30) {
        const saveResult = await BTCOHLC.insertMany(ohlcBatch, {
          limit: 300,
          rawResult: true,
        });
        console.info(`[${
          ohlcBatch[0].date.toUTCString()
        }] btc ${timeframe} ohlc in: ${ohlcBatch.length} | saved: ${saveResult.insertedCount}`);
        ohlcBatch = [];
      }
      currentCandleTimestamp += timeframeTime;
    }
    if (ohlcBatch.length > 0) {
      const saveResult = await BTCOHLC.insertMany(ohlcBatch, {
        limit: 300,
        rawResult: true,
      });
      console.info(`[${
        ohlcBatch[0].date.toUTCString()
      }] btc ${timeframe} ohlc in: ${ohlcBatch.length} | saved: ${saveResult.insertedCount}`);
    }
  }
}

module.exports.createSyntheticTimeframes = createSyntheticTimeframes;
