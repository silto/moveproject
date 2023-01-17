"use strict";
/* eslint-disable camelcase */
const fetch = require("node-fetch");
const qs = require("querystring");
const {default: PQueue} = require("p-queue");
const BASE_URI = "https://ftx.com/api";
const OHLC_PERIODS = {
  "1m": 60,
  "3m": 180,
  "5m": 300,
  "15m": 900,
  "30m": 1800,
  "1h": 3600,
  "2h": 7200,
  "4h": 14400,
  "6h": 21600,
  "12h": 43200,
  "1d": 86400,
  "3d": 259200,
  "1w": 604800,
};

const HARD_LIMIT = 43240;

const ohlcMapping = ohlc => ({
  timestamp: Math.round(ohlc.time/1000),
  date: new Date(ohlc.startTime),
  open: ohlc.open,
  high: ohlc.high,
  low: ohlc.low,
  close: ohlc.close,
  volume: ohlc.volume,
});

const tradeMapping = trade => {
  const date = new Date(trade.time);
  return {
    timestamp: Math.round(date.getTime()/1000),
    date: date,
    liquidation: trade.liquidation,
    price: trade.price,
    side: trade.side,
    size: trade.size,
  };
};

const interfaceMethods = {
  market: {
    getOHLC: (limitedFetch, marketId, params) => {
      console.log(`fetching OHLC for ${marketId}, period ${params.period || "1h"}`);
      let OHLCArray = [];
      let numberOfRequests = 0;
      const fetchLoop = (resolve, before) => {
        const paramsObj = {};
        if (before) {
          paramsObj.end_time = before;
        } else if (params.before) {
          paramsObj.end_time = params.before;
        } else {
          paramsObj.end_time = Math.round(new Date().getTime()/1000);
        }
        if (params.after) {
          if (paramsObj.end_time && paramsObj.end_time - params.after < HARD_LIMIT) {
            paramsObj.start_time = params.after;
          } else {
            paramsObj.start_time = paramsObj.end_time - HARD_LIMIT;
          }
        }
        if (params.period) {
          paramsObj.resolution = OHLC_PERIODS[params.period];
        } else {
          paramsObj.resolution = OHLC_PERIODS["1h"];
        }
        const url = `${BASE_URI}/markets/${marketId}/candles?${qs.stringify(paramsObj)}`;
        console.log("fetch url ", url);
        limitedFetch(url)
        .then(res => res.json())
        .then(json => {
          console.log(`OHLC for ${marketId}, period ${params.period || "1h"} result length`, json && json.result && json.result.length);
          // finished because no more data to fetch
          if (!json || !json.result || json.result.length === 0) {
            return resolve(OHLCArray);
          }
          numberOfRequests +=1;

          let newOHLCs = json.result;
          let firstNewIndex = newOHLCs.length;
          for (let i = newOHLCs.length - 1; i >=0; i--) {
            if (OHLCArray.some(ohlc => ohlc.time === newOHLCs[i].time)) {
              firstNewIndex -= 1;
            } else {
              break;
            }
          }
          if (firstNewIndex === 0) { // finished because we're just looping on the same OHLC
            return resolve(OHLCArray);
          }
          console.log(`removing overlapping ohlc (${newOHLCs.length - firstNewIndex})`);
          let cleanedNewOHLCs = newOHLCs.slice(0,firstNewIndex);

          OHLCArray = cleanedNewOHLCs.concat(OHLCArray);
          // finished because request number limit (avoid infinite loop)
          if (!params.after && numberOfRequests >= 30) {
            return resolve(OHLCArray);
          }
          const firstCandleTimestamp = Math.round(OHLCArray[0].time/1000);
          //finished because we have reached params.after
          if (params.after && (firstCandleTimestamp <= params.after)) {
            return resolve(OHLCArray);
          }
          // not finished, so continue
          return fetchLoop(resolve, firstCandleTimestamp);
        });
      };
      return new Promise((resolve) => {
        fetchLoop(resolve);
      })
      .then((res) => {
        console.log(`fetching OHLC for ${marketId}, period ${params.period || "1h"} took ${numberOfRequests} requests`);
        return res.map(ohlcMapping);
      });
    },
    getTrades: (limitedFetch, marketId, params) => {
      console.log(`fetching trades for ${marketId}`);
      let TradesArray = [];
      let numberOfRequests = 0;
      const fetchLoop = (resolve, before) => {
        const paramsObj = {
          limit: 100,
        };
        if (before) {
          paramsObj.end_time = before;
        } else if (params.before) {
          paramsObj.end_time = params.before;
        }
        if (params.after) {
          paramsObj.start_time = params.after;
        }
        const url = `${BASE_URI}/markets/${marketId}/trades?${qs.stringify(paramsObj)}`;
        console.log("fetch url ", url);
        return limitedFetch(url)
        .then(res => res.json())
        .then(json => {
          console.log(`trades for ${marketId} result length`, json && json.result && json.result.length);
          // finished because no more data to fetch
          if (!json || !json.result || json.result.length === 0) {
            return resolve(TradesArray);
          }
          numberOfRequests +=1;
          let newTrades = json.result;
          let firstNewIndex = 0;
          for (let i = 0; i < newTrades.length; i++) {
            if (TradesArray.some(trade => trade.id === newTrades[i].id)) {
              firstNewIndex += 1;
            } else {
              break;
            }
          }
          if (firstNewIndex === newTrades.length) { // finished because we're just looping on remaining trades
            return resolve(TradesArray);
          }
          // console.log(`removing overlapping trades (${firstNewIndex})`);
          let cleanedNewTrades = newTrades.slice(firstNewIndex);
          TradesArray = cleanedNewTrades.reverse().concat(TradesArray);
          // finished because request number limit (avoid infinite loop)
          if (numberOfRequests >= 100) {
            return resolve(TradesArray);
          }
          const firstTradeDate = new Date(TradesArray[0].time);
          const firstTradeTimestamp = Math.round(firstTradeDate.getTime()/1000);
          //finished because we have reached params.after
          if (params.after && (firstTradeTimestamp <= params.after)) {
            return resolve(TradesArray);
          }
          // not finished, so continue
          return fetchLoop(resolve, firstTradeTimestamp + 1);
        });
      };
      return new Promise((resolve) => {
        fetchLoop(resolve);
      })
      .then(res => {
        console.log(`fetching trades for ${marketId} took ${numberOfRequests} requests`);
        return res.map(tradeMapping);
      });
    },
    getExpirationPrice: (limitedFetch, marketId) => {
      return limitedFetch(`${BASE_URI}/futures/${marketId}/stats`)
      .then(res => res.json())
      .then(json => {
        return json.result.expirationPrice;
      });
    },
    getInfos: (limitedFetch, marketId) => {
      return limitedFetch(`${BASE_URI}/markets/${marketId}`)
      .then(res => res.json())
      .then(json => {
        if (json.success === false) {
          return null;
        }
        return {
          minProvideSize: json.result.minProvideSize,
          priceIncrement: json.result.priceIncrement,
          sizeIncrement: json.result.sizeIncrement,
        };
      });
    },
  },
};
const rateLimit = 20;// limit to 20 requests per second (API limit is theorically 30/sec but let's be careful)
const queue = new PQueue({concurrency: 1, intervalCap: rateLimit, interval: 1000});
const limitedFetch = (url) => queue.add(() => fetch(url));
const rateLimitWrapper = (interfaceFunc) => {
  return (...interfaceArgs) => {
    return interfaceFunc(limitedFetch, ...interfaceArgs);
  };
};

const deepWrap = (methodsObject, target) => {
  Object.keys(methodsObject).forEach(key => {
    if (typeof methodsObject[key] === "function") {
      target[key] = rateLimitWrapper(methodsObject[key]);
    } else if (typeof methodsObject[key] === "object") {
      target[key] = {};
      deepWrap(methodsObject[key], target[key]);
    }
  });
  return target;
};

module.exports = deepWrap(interfaceMethods, {});
