/* eslint-disable no-console */
const mongoose = require("mongoose");
const Move = mongoose.model("Move");
const OHLC = mongoose.model("OHLC");
const Trade = mongoose.model("Trade");
const moment = require("moment");
const { performance } = require("perf_hooks");
const config = require("../../config");
const apiInterface = require("../interface").ftx;
const btcApiInterface = require("../interface")[config.priceDataInterface];
const btcApiInterfaceConfig = config.interfacesConfig[config.priceDataInterface];
const getAllowance = require("../interface/utils/allowance");
const {getMoveIV} = require("../utils/optionUtils");
const {
  getContractName,
  getContractTimings,
  getBeforeDate,
  getAfterDate,
  reconstructData,
  prepareForSave,
} = require("../utils/moveUtils");

/*

  This function fetches sequentially
    - all MOVE contracts data from FTX
    - the price (OHLC) history for the selected durations
    - the trades
    - the expiration price
  It then formats it to our internal data format
  and computes additional metrics that we don't want to compute on the fly like Implied Volatility.
  It then puts it all in the database.

*/

module.exports = function(duration, params) {
  // global variables that stay between iterations
  const timeframesToGet = params.timeframes.split(",");
  let btcInterfaceAllowance = null;

  const ohlcProm = (timeIndex, resolve, reject) => {
    // compute the time boundaries of the contract
    const beforeDate = getBeforeDate(timeIndex, duration);
    const afterDate = getAfterDate(timeIndex, duration);

    if (beforeDate.isAfter(moment())) {
      console.info("skipping, contract not over yet");
      return ohlcProm(timeIndex+1, resolve, reject);
    }
    // get the name of the contract from the dates (API name and normalized name)
    const currentContract = getContractName("BTC-MOVE", timeIndex, duration);
    console.info("________________________________________________________");
    console.info(`Starting ${currentContract.normalizedName}`);
    // check the existance of the contract in db
    Move.findOne({symbol: currentContract.normalizedName})
    .then(existingMOVERecord => {
      if (existingMOVERecord) {
        // skip or end here if it already exists
        if (params.skipIfAlreadyInDb) {
          console.info(`${currentContract.normalizedName} already in db, skipping`);
          ohlcProm(timeIndex+1, resolve, reject);
        } else {
          console.info(`${currentContract.normalizedName} already in db, ending here.`);
          setTimeout(() => resolve(), 5000);
        }
        return;
      }
      // get the basic contract infos and check if it exists in the API
      apiInterface.market.getInfos(
        currentContract.apiName
      )
      .then((infos) => {
        if (!infos) {
          console.info(`${currentContract.normalizedName} doesn't exist, considering this is the end of the road.`);
          setTimeout(() => resolve(), 5000);
          return;
        }
        const callTime = performance.now();
        // add OHLC fetching for all the required durations in the call stack
        const ohlcCallStack = timeframesToGet.map((timeframeToGet) => {
          const beforeDate = getBeforeDate(timeIndex, duration);
          return apiInterface.market.getOHLC(
            currentContract.apiName,
            {
              period: timeframeToGet,
              before: beforeDate.unix(),
              after: afterDate.unix(),
            }
          );
        });
        // add trades fetching and expiration price fetching to the call stack, and run the promises
        // the API interface handles throttling to avoid rate limiting
        Promise.all([
          Promise.all(ohlcCallStack),
          apiInterface.market.getTrades(
            currentContract.apiName,
            {
              after: afterDate.unix(),
              before: beforeDate.unix(),
            }
          ),
          apiInterface.market.getExpirationPrice(
            currentContract.apiName
          ),
        ])
        .then(([ohlcDataIn, tradeDataIn, expirationPrice]) => {
          let ohlcData = {};
          /*
            ohlcData = {
            1m: [...history with 1m candles],
            1h: ...
          }
          */
          console.info("got ohlcdata");
          let endOfTheRoad = false;
          // clean up the OHLC data (there can be missing candles at the start or additional candle at the end
          // this will repair by filling with padding candles, and signal if the data is too corrupted
          // (more than one 1h candle missing is considered corrupted and process will abort)
          timeframesToGet.forEach((timeframe, index) => {
            const res = reconstructData(ohlcDataIn[index], timeframe, afterDate, beforeDate);
            endOfTheRoad = timeframe === "1h" && res.corrupted;
            ohlcData[timeframe] = res.history;
            console.info(`new history (${timeframe}) of length ${ohlcData[timeframe].length} on contract ${currentContract.normalizedName}`);
          });
          if (endOfTheRoad) {
            setTimeout(() => resolve(), 5000);
            return;
          }
          // get Implied Volatility from the Black Scholes solver. This is an approximation.
          console.info(`${tradeDataIn.length} trades`);
          const timings = getContractTimings(afterDate, duration);
          console.info("getting IVs");
          Promise.all([
            getMoveIV(ohlcData["1h"][0], timings.openDate, timings.closeDate, btcInterfaceAllowance),
            getMoveIV(ohlcData["1h"][24], timings.openDate, timings.closeDate, btcInterfaceAllowance),
          ])
          .then(([IVFuture, IVOpen]) => {
            console.info(`got IVs: Future = ${IVFuture*100}% | Open = ${IVOpen*100}%`);
            // uncomment below for a dry run (only fetch, no save)
            // console.info("dry run, aborting");
            // return resolve();

            // create Move Mongo document first, as it will be referenced by all the OHLC & Trade documents
            let move = new Move({
              symbol: currentContract.normalizedName,
              openDuration: duration,
              openAsFutureDate: timings.openAsFutureDate,
              openDate: timings.openDate,
              closeDate: timings.closeDate,
              expirationPrice,
              IVFuture,
              IVOpen,
              //TODO strike?
            });
            // save the document
            move.save((err, savedMove) => {
              if (err) {
                console.error(`error saving ${currentContract.normalizedName}`);
                console.error(err);
                setTimeout(() => reject(err), 10000);
                return;
              }
              console.info(`saved ${currentContract.normalizedName}`);
              // get the id and the symbol and put them in all the OHLC & Trade documents
              const moveId = savedMove._id;
              const moveSymbol = savedMove.symbol;
              const preparedOHLCData = {};
              timeframesToGet.forEach((timeframe) => {
                preparedOHLCData[timeframe] = prepareForSave(ohlcData[timeframe], moveId, moveSymbol);
              });
              const preparedTrades = prepareForSave(tradeDataIn, moveId, moveSymbol);
              // save all the OHLC for the timeframes requested.
              new Promise((resolve2) => {
                let i = 0;
                const saveOHLCPeriod = () => {
                  const timeframeToSave = timeframesToGet[i];
                  const ohlcBatch = preparedOHLCData[timeframeToSave];
                  OHLC.insertMany(ohlcBatch, {
                    limit: 300,
                    rawResult: true,
                  })
                  .then((res) => {
                    console.info(`inserted OHLC for timeframe ${timeframeToSave}`);
                    console.info(`ohlc in count: ${ohlcBatch.length} | ohlc saved count: ${res.insertedCount}`);
                    i += 1;
                    if (i >= timeframesToGet.length) {
                      return resolve2();
                    }
                    saveOHLCPeriod();
                  });
                };
                saveOHLCPeriod();
              })
              .then(() => {
                // save the trades
                return Trade.insertMany(preparedTrades, {
                  limit: 300,
                  rawResult: true,
                })
                .then((res) => {
                  console.info(`inserted trades`);
                  console.info(`trades in count: ${preparedTrades.length} | trades saved count: ${res.insertedCount}`);
                  return;
                });
              })
              .then(() => {
                // end of the process, little timeout for additional rate limiting safety, and start the next iteration
                console.info(`All done with ${currentContract.normalizedName}`);
                const endOfCallTime = performance.now();
                if (endOfCallTime - callTime < 100) { // basic rate limiting to avoid doing > 10 requests per second
                  setTimeout(ohlcProm(timeIndex+1, resolve, reject),100);
                } else {
                  ohlcProm(timeIndex+1, resolve, reject);
                }
              });
            });
          });
        });
      });
    });
  };

  return new Promise((resolve, reject) => {
    // get the remaining allowance for the module that gets the BTC price.
    getAllowance(btcApiInterface, btcApiInterfaceConfig)
    .then((allowanceObj) => {
      btcInterfaceAllowance = allowanceObj;
      // start the loop, the day before today (only expired contracts are stored)
      ohlcProm(1, resolve, reject);
    });
  });
};
