const moment = require("moment");
const { OHLC_TIMEFRAMES } = require("./constants");

module.exports.getContractName = function(contractName, timeIndex, duration) {
  //apiName: BTC-MOVE-0413 or BTC-MOVE-20190913 if other year than current one
  // normalizedName: BTC-MOVE-20200413
  const today = moment();
  const todaySave = moment();
  if (duration === "daily") {
    const contractDate = today.subtract(timeIndex, "days");
    const mth = contractDate.month() + 1;
    const day = contractDate.date();
    const year = contractDate.year();
    const todayYear = todaySave.year();
    const normalizedName = `${contractName}-${
      year
    }${
      mth.toString().length === 1? "0":""
    }${
      mth
    }${
      day.toString().length === 1? "0":""
    }${
      day
    }`;
    let apiName = todayYear === year?
      `${contractName}-${
        mth.toString().length === 1? "0":""
      }${
        mth
      }${
        day.toString().length === 1? "0":""
      }${
        day
      }` :
      normalizedName;
    if (year === 2019 && mth === 12 && day === 31) { // handle the 20191231 issue (contract named 1231)
      apiName = `${contractName}-${
        mth.toString().length === 1? "0":""
      }${
        mth
      }${
        day.toString().length === 1? "0":""
      }${
        day
      }`;
    }
    // console.info("api",apiName, "normalized", normalizedName);
    return {
      normalizedName,
      apiName,
    };
  }
};

module.exports.getContractTimings = function(startDate, duration) {
  if (duration === "daily") {
    return {
      openAsFutureDate: startDate,
      openDate: startDate.clone().add(1, "days"),
      closeDate: startDate.clone().add(2, "days"),
    };
  }
};

module.exports.getBeforeDate = function(timeIndex, duration) {
  const today = moment();
  if (duration === "daily") {
    const contractEndDate = today.subtract(timeIndex - 1, "days");
    const preciseEndDate = moment.utc({
      year: contractEndDate.year(),
      month: contractEndDate.month(),
      day: contractEndDate.date(),
    });
    // const endDatePlusMargin = preciseEndDate.add(OHLC_TIMEFRAMES[timeframeToGet]*2,"seconds");
    return preciseEndDate;
  }
};

module.exports.getAfterDate = function(timeIndex, duration) {
  const today = moment();
  if (duration === "daily") {
    const contractStartDate = today.subtract(timeIndex + 1, "days");
    const preciseStartDate = moment.utc({
      year: contractStartDate.year(),
      month: contractStartDate.month(),
      day: contractStartDate.date(),
    });
    // const startDatePlusMargin = preciseStartDate.subtract(OHLC_TIMEFRAMES[timeframeToGet]*2,"seconds");
    return preciseStartDate;
  }
};

module.exports.reconstructData = function(ohlcDataIn, timeframe, startDate, endDate) {
  let ohlcData = ohlcDataIn;
  const expectedNumberOfCandles = endDate.diff(startDate, "seconds") / OHLC_TIMEFRAMES[timeframe];
  console.info(`expecting ${expectedNumberOfCandles} for timeframe ${timeframe}`);
  if (ohlcData.length !== expectedNumberOfCandles) {
    if (ohlcData.length > expectedNumberOfCandles) {
      const diff = ohlcData.length - expectedNumberOfCandles;
      console.info("slicing last candle");
      ohlcData = ohlcData.slice(0, ohlcData.length - diff);
      return {
        corrupted: diff !== 1 || moment(ohlcData[0].date).diff(startDate, "seconds") !== 0,
        history: ohlcData.map((candle, index) => ({
          timeframe: timeframe,
          position: index,
          ...candle,
        })),
      };
    } else if (ohlcData.length < expectedNumberOfCandles) {
      const diff = expectedNumberOfCandles - ohlcData.length;
      // is the first candle actually the second candle?
      console.info("creating artificial first candles");
      let firstOHLC = ohlcData[0];
      let paddingOhlc = [];
      for (let i = diff; i > 0; i--) {
        paddingOhlc.push({
          timestamp: firstOHLC.timestamp - (OHLC_TIMEFRAMES[timeframe] * i),
          date: moment(firstOHLC.date).subtract(OHLC_TIMEFRAMES[timeframe] * i,"seconds").toDate(),
          open: firstOHLC.open,
          high: firstOHLC.open,
          low: firstOHLC.open,
          close: firstOHLC.open,
          volume: 0,
        });
      }
      ohlcData = paddingOhlc.concat(ohlcData);
      return {
        corrupted: moment(ohlcData[0].date).diff(startDate, "seconds") !== 0,
        history: ohlcData.map((candle, index) => ({
          timeframe: timeframe,
          position: index,
          ...candle,
        })),
      };
    }
  }
  return {
    corrupted: false,
    history: ohlcData.map((candle, index) => ({
      timeframe: timeframe,
      position: index,
      ...candle,
    })),
  };
};

module.exports.prepareForSave = function(data, moveId, moveSymbol) {
  return data.map((ohlc) => ({
    move: moveId,
    symbol: moveSymbol,
    ...ohlc,
  }));
};

module.exports.getNormalizationReference = function(ohldDataOneHour, duration) {
  if (duration === "daily") {
    return ohldDataOneHour[24].open;
  }
};
