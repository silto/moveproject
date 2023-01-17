/* eslint-disable no-console */
const mongoose = require("mongoose");
const BTCOHLC = mongoose.model("BTCOHLC");
const {createReadStream} = require("fs");
const csvParse = require("csv-parse");
const csvParams = {
  filepath: "./csvdata/btcusd.csv",
  timestampFormat: "milli",// unix or milli
  exchange: "bitfinex",
};
const {
  getLastBTCCandle,
  createSyntheticTimeframes,
} = require("../utils/btcUtils");

const castOHLC = (rawOHLC) => {
  let timestamp = parseInt(rawOHLC.time || rawOHLC.timestamp);
  let date = null;
  if (isNaN(timestamp)) {
    timestamp = null;
  } else {
    if (csvParams.timestampFormat === "milli") {
      date = new Date(timestamp);
      timestamp = Math.round(timestamp/1000);
    } else {
      date = new Date(timestamp*1000);
    }
  }
  let open = parseFloat(rawOHLC.open);
  if (isNaN(open)) {
    open = null;
  } else {
    open = Math.round(open*100)/100;
  }
  let high = parseFloat(rawOHLC.high);
  if (isNaN(high)) {
    high = null;
  } else {
    high = Math.round(high*100)/100;
  }
  let low = parseFloat(rawOHLC.low);
  if (isNaN(low)) {
    low = null;
  } else {
    low = Math.round(low*100)/100;
  }
  let close = parseFloat(rawOHLC.close);
  if (isNaN(close)) {
    close = null;
  } else {
    close = Math.round(close*100)/100;
  }
  let volume = parseFloat(rawOHLC.volume);
  if (isNaN(volume)) {
    volume = null;
  }
  return {
    exchange: csvParams.exchange,
    timestamp,
    timeframe: "1m",
    date,
    open,
    high,
    low,
    close,
    volume,
  };
};

const skipper = (rawOHLC, startTimestamp) => {
  let timestamp = parseInt(rawOHLC.time || rawOHLC.timestamp);
  if (isNaN(timestamp)) {
    return true;
  }
  if (csvParams.timestampFormat === "milli") {
    timestamp = Math.round(timestamp/1000);
  }
  if (timestamp < startTimestamp) {
    return true;
  }
  return false;
};

const generateFillOHLC = (lastOHLC, ohlc, lastTimestamp, endTimestamp) => {
  const refPrice = lastOHLC.close || ohlc.open;
  let fillOHLC = [];
  let timestampAcc = lastTimestamp + 60;
  while (timestampAcc < endTimestamp) {
    fillOHLC.push({
      exchange: csvParams.exchange,
      timestamp: timestampAcc,
      timeframe: "1m",
      date: new Date(timestampAcc*1000),
      open: refPrice,
      high: refPrice,
      low: refPrice,
      close: refPrice,
      volume: 0,
    });
    timestampAcc += 60;
  }
  return fillOHLC;
};

async function save1mcandles(config, lastCandle) {
  const {maxTimestamp} = config;
  let startTimestamp = parseInt(maxTimestamp);
  let lastTimestamp = startTimestamp;
  let ohlcBatch = [];
  if (lastCandle && lastCandle.timestamp && lastCandle.timestamp > startTimestamp) {
    startTimestamp = lastCandle.timestamp + 1;
    lastTimestamp = lastCandle.timestamp;
  }
  let lastSavedTimestamp = lastTimestamp;
  let lastOHLC;
  const parser = csvParse({
    bom: true,
    columns: true,
  });
  createReadStream(csvParams.filepath).pipe(parser);
  let i = -1;
  for await (const rawOHLC of parser) {
    if (skipper(rawOHLC, startTimestamp)) {
      lastOHLC = castOHLC(rawOHLC);
      lastTimestamp = lastOHLC.timestamp;
      continue;
    }
    if (i >= 29) {
      const saveResult = await BTCOHLC.insertMany(ohlcBatch, {
        limit: 300,
        rawResult: true,
      });
      console.info(`[${
        ohlcBatch[0].date.toUTCString()
      }] btc 1m ohlc in: ${ohlcBatch.length} | saved: ${saveResult.insertedCount}`);
      lastSavedTimestamp = ohlcBatch[ohlcBatch.length - 1].timestamp;
      ohlcBatch = [];
      i = 0;
    } else {
      i+=1;
    }
    const ohlc = castOHLC(rawOHLC);
    if (ohlc.timestamp - lastTimestamp > 60) {
      console.info(`generating fill OHLC for a gap of ${ohlc.timestamp - lastTimestamp}s`);
      const fillOHLC = generateFillOHLC(lastOHLC, ohlc, lastTimestamp, ohlc.timestamp);
      if (fillOHLC.length > 0) {
        console.info(`filling ${fillOHLC.length} missing candles`);
        ohlcBatch = ohlcBatch.concat(fillOHLC);
      }
    }
    lastTimestamp = ohlc.timestamp;
    lastOHLC = ohlc;
    ohlcBatch.push(ohlc);
  }
  ohlcBatch = ohlcBatch.slice(0, ohlcBatch.length - 1); // remove the last candle in case it's incomplete
  if (ohlcBatch.length > 0) {
    const saveResult = await BTCOHLC.insertMany(ohlcBatch, {
      limit: 300,
      rawResult: true,
    });
    console.info(`[${
      ohlcBatch[0].date.toUTCString()
    }] btc 1m ohlc in: ${ohlcBatch.length} | saved: ${saveResult.insertedCount}`);
    lastSavedTimestamp = ohlcBatch[ohlcBatch.length - 1].timestamp;
  }
  return lastSavedTimestamp;
}

module.exports = function(config) {
  return getLastBTCCandle("1m")
  .then(lastCandle =>
    save1mcandles(config, lastCandle)
    .then((last1mCandleTimestamp) => createSyntheticTimeframes(config, last1mCandleTimestamp))
    .then(() => {
      console.log("import from csv done");
    })
    .catch(console.error)
  );
};
