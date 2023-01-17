"use strict";

const fetch = require("node-fetch");
const qs = require("querystring");
const {createCache} = require("./utils/cache");
const BASE_URI = "https://api.cryptowat.ch";
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

const marketsMapping = (market) =>  ({
  ...market,
  id: `${market.exchange}__${market.pair}`,
});

const ohlcMapping = ohlc => ({
  timestamp: ohlc[0],
  open: ohlc[1],
  high: ohlc[2],
  low: ohlc[3],
  close: ohlc[4],
  volume: ohlc[5],
});

const interfaceMethods = {
  getAllowance: () => {
    return fetch(BASE_URI)
    .then(res => res.json())
    .then(json => {
      return json.allowance;
    })
    .catch(() => {
      return {
        remaining: 0,
      };
    });
  },
  listExchanges: (symbols, cache) => {
    console.log("listExchanges");
    return cache.fetch(`${BASE_URI}/exchanges`,"all",{days: 1})
    .then(json => {
      if (symbols && symbols.length > 0) {
        return {
          result: symbols.map(symbol =>
            json.result.find(exchange => symbol === exchange.symbol)
          ),
          allowance: json.allowance,
        };
      } else {
        return json;
      }
    });
  },
  listMarkets: (ids, cache) => {
    console.log("listMarkets");
    return cache.fetch(`${BASE_URI}/markets`,"all",{days: 1})
    .then(json => {
      if (ids && ids.length > 0) {
        return {
          result: ids.map(marketId => {
            const idSplit = marketId.split("__");
            const exchange = idSplit[0];
            const pair = idSplit[1];
            return json.result.find(market =>
              market.exchange === exchange &&
              market.pair === pair
            );
          }).map(marketsMapping),
          allowance: json.allowance,
        };
      } else {
        return {
          result: json.result.map(marketsMapping),
          allowance: json.allowance,
        };
      }
    });
  },
  listPairs: (symbols, cache) => {
    console.log("listPairs");
    return cache.fetch(`${BASE_URI}/pairs`,"all",{days: 1})
    .then(json => {
      if (symbols && symbols.length > 0) {
        return {
          result: symbols.map(symbol =>
            json.result.find(pair => symbol === pair.symbol)
          ),
          allowance: json.allowance,
        };
      } else {
        return json;
      }
    });
  },
  exchange: {
    listMarkets: (exchangeSymbol, pairs, cache) => {
      console.log("exchange.listMarkets");
      return cache.fetch(`${BASE_URI}/markets/${exchangeSymbol}`,exchangeSymbol,{days: 1})
      .then(json => {
        if (pairs && pairs.length > 0) {
          return {
            result: pairs.map(pair =>
              json.result.find(market => market.pair === pair)
            )
            .map(marketsMapping),
            allowance: json.allowance,
          };
        } else {
          return {
            result: json.result.map(marketsMapping),
            allowance: json.allowance,
          };
        }
      });
    },
  },
  market: {
    getPair: (marketId, cache) => {
      console.log("market.getPair");
      const idSplit = marketId.split("__");
      const pair = idSplit[1];
      return cache.fetch(`${BASE_URI}/pairs/${pair}`, pair,{days: 1});
    },
    getExchange: (marketId, cache) => {
      console.log("market.getExchange");
      const idSplit = marketId.split("__");
      const exchange = idSplit[0];
      return cache.fetch(`${BASE_URI}/exchanges/${exchange}`, exchange,{days: 1});
    },
    getOHLC: (marketId, params) => {
      console.log("market.getOHLC");
      const idSplit = marketId.split("__");
      const exchange = idSplit[0];
      const pair = idSplit[1];
      const paramsObj = {};
      if (params.before) {
        paramsObj.before = params.before;
      }
      if (params.after) {
        paramsObj.after = params.after;
      }
      if (params.period) {
        paramsObj.period = OHLC_PERIODS[params.period];
      }
      return fetch(`${BASE_URI}/markets/${exchange}/${pair}/ohlc?${qs.stringify(paramsObj)}`)
      .then(res => res.json())
      .then(json => {
        return {
          result: json.result[`${paramsObj.period}`].map(ohlcMapping),
          allowance: json.allowance,
        };
      });
    },
  },
  pair: {
    getMarkets: (pairSymbol, cache) => {
      return cache.fetch(`${BASE_URI}/pairs/${pairSymbol}`, pairSymbol,{days: 1})
      .then(json => ({
        result: json.result.markets,
        allowance: json.allowance,
      }));
    },
  },
};

const allowanceWrapper = (interfaceFunc) => {
  let _meanAllowanceCost = null;
  let _requestCounter = 0;
  const _updateAllowanceCost = (cost) => {
    _requestCounter++;
    if (!_meanAllowanceCost) {
      _meanAllowanceCost = cost;
    } else {
      _meanAllowanceCost = (_meanAllowanceCost*(_requestCounter - 1) + cost) / _requestCounter;
    }
  };
  const cache = createCache((data) => ({result: data}), (json) => json.result);
  return (allowanceMethods, ...interfaceArgs) => {
    if (allowanceMethods.get() < (_meanAllowanceCost || 2000000)) {
      return new Error(`allowance low - ${
        allowanceMethods.get()
      }\n mean allowance for this method is ${
        _meanAllowanceCost || 2000000
      }`);
    }
    return interfaceFunc(...interfaceArgs, cache)
    .then(({result, allowance}) => {
      if (allowance) {
        allowanceMethods.set(allowance.remaining);
        _updateAllowanceCost(allowance.cost);
      }
      console.log(`new allowance: ${allowanceMethods.get()}`);
      return result;
    });
  };
};

const deepWrap = (methodsObject, target) => {
  Object.keys(methodsObject).forEach(key => {
    if (key === "getAllowance") {
      target[key] = methodsObject[key];
      return;
    }
    if (typeof methodsObject[key] === "function") {
      target[key] = allowanceWrapper(methodsObject[key]);
    } else if (typeof methodsObject[key] === "object") {
      target[key] = {};
      deepWrap(methodsObject[key], target[key]);
    }
  });
  return target;
};

module.exports = deepWrap(interfaceMethods, {});
