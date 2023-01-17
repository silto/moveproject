const moment = require("moment");
const mongoose = require("mongoose");
const Backtest = mongoose.model("Backtest");
const Move = mongoose.model("Move");
const OHLC = mongoose.model("OHLC");
const config = require("../../config");

// const backtestConfig = config.jobs.backtest;

const getMovePipeline = (startTime, endTime) => {
  let pipeline = [];
  if (startTime && endTime) {
    pipeline.push({
      "$match": {
        "openDuration": "daily",
        "openDate": {
          "$gte": startTime,
          "$lt": endTime,
        },
      },
    });
  } else if (startTime) {
    pipeline.push({
      "$match": {
        "openDuration": "daily",
        "openDate": {
          "$gte": startTime,
        },
      },
    });
  } else if (endTime) {
    pipeline.push({
      "$match": {
        "openDuration": "daily",
        "openDate": {
          "$lt": endTime,
        },
      },
    });
  } else {
    pipeline.push({
      "$match": {
        "openDuration": "daily",
      },
    });
  }
  return pipeline.concat([
    {
      "$sort": {
        "openDate": 1,
      },
    }, {
      "$lookup": {
        "from": "ohlcs",
        "let": {
          "moveId": "$_id",
          "timeframe": "1h",
        },
        "pipeline": [
          {
            "$match": {
              "$expr": {
                "$and": [
                  {
                    "$eq": [
                      "$move", "$$moveId",
                    ],
                  }, {
                    "$eq": [
                      "$timeframe", "$$timeframe",
                    ],
                  },
                ],
              },
            },
          }, {
            "$sort": {
              "date": 1,
            },
          },
        ],
        "as": "candles",
      },
    }, {
      "$lookup": {
        "from": "btcohlcs",
        "let": {
          "openAsFutureDate": "$openAsFutureDate",
          "closeDate": "$closeDate",
          "timeframe": "1h",
        },
        "pipeline": [
          {
            "$match": {
              "$expr": {
                "$and": [
                  {
                    "$gte": [
                      "$date", "$$openAsFutureDate",
                    ],
                  }, {
                    "$lt": [
                      "$date", "$$closeDate",
                    ],
                  }, {
                    "$eq": [
                      "$timeframe", "$$timeframe",
                    ],
                  },
                ],
              },
            },
          }, {
            "$sort": {
              "date": 1,
            },
          },
        ],
        "as": "btcCandles",
      },
    },
  ]);
};

const START_EQUITY = 100;
const MAINTENANCE_MARGIN_FRACTION = 3;

const nullify = (val) => {
  if (typeof val !== "number") {
    return 0;
  }
  return val;
};

const dayMatch = (dayNum) => {
  switch (dayNum) {
    case 0:
      return "sun";
    case 1:
      return "mon";
    case 2:
      return "tue";
    case 3:
      return "wed";
    case 4:
      return "thu";
    case 5:
      return "fri";
    case 6:
      return "sat";
    default:
      return "sun";
  }
};

const testTradeDay = (move, parameters) => {
  const {
    daysOfWeek,
  } = parameters;
  if (!daysOfWeek) {
    return true;
  }
  const {
    openDate,
  } = move;
  const moveDayOfWeek = moment(openDate).day();
  const dayString = dayMatch(moveDayOfWeek);
  if (typeof daysOfWeek[dayString] === "boolean" && !daysOfWeek[dayString]) {
    return false;
  }
  return true;
};

async function runBacktest(backtest) {
  console.info(`running backtest id: ${backtest._id.toString()}`);
  console.info(`params:\n${backtest.parameters}`);
  backtest.status = "running";
  backtest.startRunTime = new Date();
  await backtest.save();
  const {parameters} = backtest;
  let {
    startTime,
    endTime,
    side,
    positionSize,
    takeProfit,
    stopLoss,
    openCandle,
    takerFee,
    makerFee,
    slippage,
  } = parameters;

  openCandle = nullify(openCandle);
  takerFee = nullify(takerFee);
  makerFee = nullify(makerFee);
  slippage = nullify(slippage);
  let results = {
    trades: 0,
    wins: 0,
    losses: 0,
    maxDrawDown: 0,
    maxEquity: START_EQUITY,
    minEquity: START_EQUITY,
    startAccount: START_EQUITY,
    endAccount: START_EQUITY,
    liquidated: false,
    equityHistory: [],
  };
  let initPrice = 0;
  let stopPrice = null;
  let tpPrice = null;
  let stopIndex = null;
  let tpIndex = null;
  let liqIndex = null;
  let isStopped = false;
  let isTped = false;
  let isLiquidated = false;
  let engaged, size, liqPrice, valueAtEnd, rawPNL, enterFee, closeFee;
  let isFirstGo = true;
  const sideVal = side === "long"? 1 : -1;
  for await (const move of Move.aggregate(getMovePipeline(startTime, endTime))) {
    config.jobs.backtest.verbose && console.info("new move");
    const {
      symbol,
      openDate,
      expirationPrice,
      candles,
      btcCandles,
    } = move;
    if (!candles || !btcCandles) {
      console.error(`missing candles in ${symbol}`);
      continue;
    }
    if (isFirstGo) {
      results.equityHistory.push({
        date: moment(openDate).subtract(1, "days").toDate(),
        equity: START_EQUITY,
      });
      isFirstGo = false;
    }
    const tradeDay = testTradeDay(move, parameters);
    if (!tradeDay) {
      config.jobs.backtest.verbose && console.info("no trade taken");
      results.equityHistory.push({
        date: openDate,
        equity: results.endAccount,
      });
      continue;
    }
    results.trades += 1;
    initPrice = candles[openCandle].open;
    stopIndex = null;
    tpIndex = null;
    isStopped = false;
    isTped = false;
    // check if stop gets hit
    if (stopLoss) {
      stopPrice = initPrice * (1 - sideVal * stopLoss/100);
      config.jobs.backtest.verbose && console.info(`looking for stop hit in [${openCandle} - ${candles.length}[`);
      for (let i = openCandle; i < candles.length; i++) {
        if (side === "long") {
          if (candles[i].low <= stopPrice) {
            isStopped = true;
            stopIndex = i;
            config.jobs.backtest.verbose && console.info("is stopped at stopIndex", stopIndex);
            break;
          }
        } else {
          if (candles[i].high >= stopPrice) {
            isStopped = true;
            stopIndex = i;
            config.jobs.backtest.verbose && console.info("is stopped at stopIndex", stopIndex);
            break;
          }
        }
      }
    }
    engaged = results.endAccount * (positionSize/100);
    size = engaged / initPrice;
    // check if the account gets liquidated before tp of stop
    liqPrice = (results.endAccount - sideVal * engaged) / (size * MAINTENANCE_MARGIN_FRACTION / 100 - sideVal * size);
    if (!stopLoss || sideVal * (liqPrice - stopPrice) >= 0) { // stop is behind liq price
      config.jobs.backtest.verbose && console.info("no stop or stop behind liq price");
      let endCandle = candles.length - 1;
      if (isStopped && stopIndex < endCandle) {
        endCandle = stopIndex;
      }
      config.jobs.backtest.verbose && console.info(`looking for stop hit in [${openCandle} - ${endCandle}]`);
      for (let i = openCandle; i <= endCandle; i++) {
        if (side === "long") {
          if (candles[i].low <= liqPrice) {
            isLiquidated = true;
            liqIndex = i;
            config.jobs.backtest.verbose && console.info("is liqd at liqIndex", liqIndex);
            break;
          }
        } else {
          if (candles[i].high >= liqPrice) {
            isLiquidated = true;
            liqIndex = i;
            config.jobs.backtest.verbose && console.info("is liqd at liqIndex", liqIndex);
            break;
          }
        }
      }
    }
    // check if TP gets hit before stop or end of contract
    if (takeProfit) {
      tpPrice = initPrice * (1 + sideVal * takeProfit/100);
      let endCandle = candles.length - 1;
      if (isStopped && stopIndex < endCandle) {
        endCandle = stopIndex;
      }
      if (isLiquidated && liqIndex < endCandle) {
        endCandle = liqIndex;
      }
      config.jobs.backtest.verbose && console.info(`looking for tp hit in [${openCandle} - ${endCandle}]`);
      for (let i = openCandle; i <= endCandle; i++) {
        if (side === "long") {
          if (candles[i].high >= tpPrice) {
            isTped = true;
            tpIndex = i;
            config.jobs.backtest.verbose && console.info("is tpd at tpIndex", tpIndex);
            if (i < endCandle) {
              config.jobs.backtest.verbose && console.info("setting stop & liq to null");
              isStopped = false;
              stopIndex = null;
              isLiquidated = false;
              liqIndex = null;
            }
            break;
          }
        } else {
          if (candles[i].low <= tpPrice) {
            isTped = true;
            tpIndex = i;
            config.jobs.backtest.verbose && console.info("is tpd at tpIndex", tpIndex);
            if (i < endCandle) {
              config.jobs.backtest.verbose && console.info("setting stop & liq to null");
              isStopped = false;
              stopIndex = null;
              isLiquidated = false;
              liqIndex = null;
            }
            break;
          }
        }
      }
    }
    // check if we need to zoom in on a candle to figure out if tp came before liq
    if ((isLiquidated && isTped && liqIndex === tpIndex) || (isStopped && isTped && stopIndex === tpIndex)) {
      if (config.jobs.backtest.verbose) {
        config.jobs.backtest.verbose && console.info(`checking ambiguous tp & ${isLiquidated? "liq" : "stop"}`);
      }
      const candle = candles[tpIndex];
      const candleStart = moment(candle.date);
      const candleEnd = candleStart.clone().add(1, "h");
      let subCandles;
      // get the 1m candles inside the 1h candle
      try {
        subCandles = await OHLC.find({
          move: move._id,
          timeframe: "1m",
          date: {
            "$gte": candleStart,
            "$lt": candleEnd,
          },
        })
        .sort({date: 1})
        .lean()
        .exec();
      } catch (e) {
        console.error("error trying to fetch subcandles");
        console.error(e);
      }
      if (subCandles && subCandles.length > 0) {
        let tpSubIndex, liqSubIndex, stopSubIndex;
        // get liquidation position
        if (isLiquidated) {
          config.jobs.backtest.verbose && console.info("checking liq position on sub candles");
          for (let i = 0; i < subCandles.length; i++) {
            if (side === "long") {
              if (subCandles[i].low <= liqPrice) {
                liqSubIndex = i;
                config.jobs.backtest.verbose && console.info(`liq is at subindex ${liqSubIndex}`);
                break;
              }
            } else {
              if (subCandles[i].high >= liqPrice) {
                liqSubIndex = i;
                config.jobs.backtest.verbose && console.info(`liq is at subindex ${liqSubIndex}`);
                break;
              }
            }
          }
        //get stop position
        } else if (isStopped) {
          config.jobs.backtest.verbose && console.info("checking stop position on sub candles");
          for (let i = 0; i < subCandles.length; i++) {
            if (side === "long") {
              if (subCandles[i].low <= stopPrice) {
                stopSubIndex = i;
                config.jobs.backtest.verbose && console.info(`stop is at subindex ${stopSubIndex}`);
                break;
              }
            } else {
              if (subCandles[i].high >= stopPrice) {
                stopSubIndex = i;
                config.jobs.backtest.verbose && console.info(`stop is at subindex ${stopSubIndex}`);
                break;
              }
            }
          }
        }
        // get tp position
        config.jobs.backtest.verbose && console.info("checking tp position on sub candles");
        for (let i = 0; i < subCandles.length; i++) {
          if (side === "long") {
            if (subCandles[i].high >= tpPrice) {
              tpSubIndex = i;
              config.jobs.backtest.verbose && console.info(`TP is at subindex ${tpSubIndex}`);
              break;
            }
          } else {
            if (subCandles[i].low <= tpPrice) {
              tpSubIndex = i;
              config.jobs.backtest.verbose && console.info(`TP is at subindex ${tpSubIndex}`);
              break;
            }
          }
        }
        // decide if liq/stop came before TP
        if (isLiquidated && liqSubIndex > tpSubIndex) {
          config.jobs.backtest.verbose && console.info(`TP came before liq, nullifying liq`);
          isLiquidated = false;
          liqIndex = null;
        } else if (isStopped && stopSubIndex > tpSubIndex) {
          config.jobs.backtest.verbose && console.info(`TP came before stop, nullifying stop`);
          isStopped = false;
          stopIndex = null;
        }
      } else { // in case we can't get the sub candles for some reason, assume the worst (liquidated or stopped before tp)
        config.jobs.backtest.verbose && console.info("could not get sub candles");
        isTped = false;
      }
    }
    // compute and add results if there was a liquidation
    if (isLiquidated) {
      config.jobs.backtest.verbose && console.info("position liquidated");
      results.losses += 1;
      valueAtEnd = size * liqPrice;
      rawPNL = sideVal * (valueAtEnd - engaged);
      enterFee = takerFee/100 * btcCandles[openCandle].close * size;
      closeFee = 0;
      results.endAccount = 0;
      results.liquidated = true;
      results.equityHistory.push({
        date: openDate,
        equity: 0,
      });
    // compute and add results in case the position was stopped
    } else if (isStopped) {
      config.jobs.backtest.verbose && console.info("position stopped");
      results.losses += 1;
      valueAtEnd = size * stopPrice * (1 - sideVal * (slippage / 100));
      rawPNL = sideVal * (valueAtEnd - engaged);
      enterFee = takerFee/100 * btcCandles[openCandle].close * size;
      closeFee = takerFee/100 * btcCandles[stopIndex].close * size;
      results.endAccount = results.endAccount + rawPNL - (enterFee + closeFee);
      results.equityHistory.push({
        date: openDate,
        equity: results.endAccount,
      });
    } else {
      // compute and add results in case the position was TPed
      if (isTped) {
        config.jobs.backtest.verbose && console.info("position is tped");
        results.wins += 1;
        valueAtEnd = size * tpPrice;
        rawPNL = sideVal * (valueAtEnd - engaged);
        enterFee = takerFee/100 * btcCandles[openCandle].close * size;
        closeFee = makerFee/100 * btcCandles[tpIndex].close * size;
        results.endAccount = results.endAccount + rawPNL - (enterFee + closeFee);
        results.equityHistory.push({
          date: openDate,
          equity: results.endAccount,
        });
      // compute and add results in case the position got to expiration
      } else {
        config.jobs.backtest.verbose && console.info("position is taken to expiration");
        valueAtEnd = size * expirationPrice;
        rawPNL = sideVal * (valueAtEnd - engaged);
        if (rawPNL > 0) {
          results.wins += 1;
        } else {
          results.losses += 1;
        }
        enterFee = takerFee/100 * btcCandles[openCandle].close * size;
        closeFee = 0;
        results.endAccount = results.endAccount + rawPNL - (enterFee + closeFee);
        results.equityHistory.push({
          date: openDate,
          equity: results.endAccount,
        });
      }
    }
    // compute max/min equity and max drawdown
    if (results.endAccount > results.maxEquity) {
      results.maxEquity = results.endAccount;
    } else {
      const drawDown = (results.maxEquity - results.endAccount)/results.maxEquity;
      if (drawDown > results.maxDrawDown) {
        results.maxDrawDown = drawDown;
      }
    }
    if (results.endAccount < results.minEquity) {
      results.minEquity = results.endAccount;
    }
    // debug log
    if (config.jobs.backtest.verbose) {
      console.info(`init: ${
        initPrice
      }, stop: ${
        Math.round(stopPrice * 100)/100
      }, tp: ${
        Math.round(tpPrice * 100)/100
      }, liq: ${
        Math.round(liqPrice * 100)/100
      }, account: ${
        Math.round(results.endAccount * 100)/100
      }$, engaged: ${
        Math.round(engaged * 100)/100
      }$, size: ${
        Math.round(size * 100)/100
      }, isstopped: ${
        isStopped
      }, istped: ${
        isTped
      }, valueatend: ${
        Math.round(valueAtEnd * 100)/100
      }, pnl: ${
        Math.round(rawPNL * 100)/100
      }, equity: ${
        Math.round(results.endAccount * 100)/100
      }$, MAX equity: ${
        Math.round(results.maxEquity * 100)/100
      }$, MIN equity: ${
        Math.round(results.minEquity * 100)/100
      }$, MAX drawdown: ${
        Math.round(results.maxDrawDown * 10000)/100
      }%, fee: ${
        Math.round((enterFee + closeFee) * 100)/100
      }$ (BTC:${
        btcCandles[openCandle].close
      }$)`);
    }
    if (results.liquidated) {
      config.jobs.backtest.verbose && console.info("***************** ACCOUNT BLOWN *****************");
      break;
    }
  }
  // debug log
  if (config.jobs.backtest.verbose) {
    console.info("***************** RESULT *****************");
    console.info(`${results.trades} trades | ${results.wins} wins | ${results.losses} losses | account at end: ${results.endAccount}`);
  }
  backtest.results = results;
  backtest.markModified("results");
  backtest.status = "finished";
  backtest.endRunTime = new Date();
  await backtest.save();
  console.info(`finished backtest id: ${backtest._id.toString()}`);
}

module.exports = function(data) {
  if (!config.jobs.backtest.enabled) {
    return Promise.reject("backtest job not enabled");
  }
  return Backtest.findOne({_id: data.backtestId})
  .exec()
  .then((backtest) => {
    if (!backtest) {
      return Promise.reject("backtest infos not found in db");
    }
    if (backtest.status === "canceled") {
      console.info(`not running canceled backtest id: ${backtest._id.toString()}`);
      return Promise.resolve("backtest canceled");
    }
    return runBacktest(backtest)
    .catch((err) => {
      if (config.debug) {
        console.error("error running backtest");
        console.error(err);
        backtest.error = err.toString();
        backtest.status = "error";
        backtest.save();
      }
      return Promise.reject("error running backtest, exiting backtest");
    });
  });
};
