"use strict";
// cryptocompare API wrapper
const fetch = require("node-fetch");
const qs = require("querystring");
const moment = require("moment");
const currencies = require("./utils/currencies");
const {createCache, createDuration} = require("./utils/cache");
const currenciesAsAssets = Object.keys(currencies).map(symbol => ({
  symbol: symbol,
  name: currencies[symbol],
  isFiat: true,
}));
const BASE_URI = "https://min-api.cryptocompare.com";
const MAX_ALLOWANCE_AGE = {minutes: 5};
const OHLC_PERIODS = {
  "1m": {
    endpoint: "minute",
    aggregate: "1",
    periodSecs: 60,
  },
  "3m": {
    endpoint: "minute",
    aggregate: "3",
    periodSecs: 180,
  },
  "5m": {
    endpoint: "minute",
    aggregate: "5",
    periodSecs: 300,
  },
  "15m": {
    endpoint: "minute",
    aggregate: "15",
    periodSecs: 900,
  },
  "30m": {
    endpoint: "minute",
    aggregate: "30",
    periodSecs: 1800,
  },
  "1h": {
    endpoint: "hour",
    aggregate: "1",
    periodSecs: 3600,
  },
  "2h": {
    endpoint: "hour",
    aggregate: "2",
    periodSecs: 7200,
  },
  "4h": {
    endpoint: "hour",
    aggregate: "4",
    periodSecs: 14400,
  },
  "6h": {
    endpoint: "hour",
    aggregate: "6",
    periodSecs: 21600,
  },
  "12h": {
    endpoint: "hour",
    aggregate: "12",
    periodSecs: 43200,
  },
  "1d": {
    endpoint: "day",
    aggregate: "1",
    periodSecs: 86400,
  },
  "3d": {
    endpoint: "day",
    aggregate: "3",
    periodSecs: 259200,
  },
  "1w": {
    endpoint: "day",
    aggregate: "7",
    periodSecs: 604800,
  },
};

const ohlcMapping = ohlc => ({
  timestamp: ohlc.time,
  open: ohlc.open,
  high: ohlc.high,
  low: ohlc.low,
  close: ohlc.close,
  volume: ohlc.volumeto,
  volumeFrom: ohlc.volumefrom,
});

const interfaceMethods = {
  getAllowance: (config) => {
    return fetch(`${BASE_URI}/stats/rate/limit?api_key=${config.APIKey}`)
    .then(res => res.json())
    .then(json => {
      return {
        remaining: json.Data.calls_left.hour,
      };
    })
    .catch(() => {
      return {
        remaining: 0,
      };
    });
  },
  listCoins: (symbols, config, cache) => {
    console.log("listCoins");
    return cache.fetch(`${BASE_URI}/data/all/coinlist?api_key=${config.APIKey}`,"all",{days: 1})
    .then(json => {
      const coinList = Object.keys(json.Data).map(id => {
        const coinInfos = json.Data[id];
        return {
          symbol: coinInfos.Symbol,
          name: coinInfos.CoinName,
          isFiat: false,
        };
      });
      if (symbols && symbols.length > 0) {
        return {
          result: symbols.map(symbol =>
            coinList.find(exchange => symbol === exchange.symbol)
          ),
        }
      } else {
        return {result: coinList};
      }
    });
  },
  listExchanges: (symbols, config, cache) => {
    console.log("listExchanges");
    return cache.fetch(`${BASE_URI}/data/exchanges/general?api_key=${config.APIKey}`,"all",{days: 1})
    .then(json => {
      const exchangeList = Object.keys(json.Data).map(id => {
        const exchangeInfos = json.Data[id];
        return {
          symbol: exchangeInfos.InternalName,
          name: exchangeInfos.Name,
          active: exchangeInfos.Trades,
        };
      }).concat([{
        symbol: "CCCAGG",
        name: "CryptoCompare",
        active: true,
      }]);
      if (symbols && symbols.length > 0) {
        return {
          result: symbols.map(symbol =>
            exchangeList.find(exchange => symbol === exchange.symbol)
          ),
        }
      } else {
        return {result: exchangeList}
      }
    });
  },
  listMarkets: (ids, config, cache) => {
    console.log("listMarkets");
    return cache.fetch(`${BASE_URI}/data/v3/all/exchanges?api_key=${config.APIKey}`,"all",{days: 1})
    .then(json => {
      let marketList = [];
      Object.keys(json.Data).forEach(exchangeId => {
        const exchangeInfos = json.Data[exchangeId];
        Object.keys(exchangeInfos.pairs).forEach(symbol => {
          exchangeInfos.pairs[symbol].forEach(quote => {
            marketList.push({
              id: `${exchangeId}__${symbol}/${quote}`,
              exchange: exchangeId,
              pair: `${symbol}/${quote}`,
              active: exchangeInfos.is_active,
            });
          });
        });
      });
      if (ids && ids.length > 0) {
        return {
          result: ids.map(marketId => {
            const idSplit = marketId.split("__");
            const exchange = idSplit[0];
            const pair = idSplit[1];
            if (exchange === "CCCAGG") {
              return {
                id: `${exchange}__${pair}`,
                exchange,
                pair,
                active: true,
              };
            }
            return marketList.find(market =>
              market.exchange === exchange &&
              market.pair === pair
            );
          }),
        };
      } else {
        return {
          result: marketList,
        };
      }
    });
  },
  exchange: {
    listMarkets: (exchangeSymbol, pairs, config, cache) => {
      console.log("exchange.listMarkets");
      if (exchangeSymbol === "CCCAGG") {
        return cache.fetch(`${BASE_URI}/data/all/coinlist?api_key=${config.APIKey}`,"all",{days: 1})
        .then(json => {
          const marketList = Object.keys(json.Data).map(id => {
            const coinInfos = json.Data[id];
            return {
              id: `CCCAGG__${coinInfos.Symbol}/EUR`,
              exchange: "CCCAGG",
              pair: `${coinInfos.Symbol}/EUR`,
              active: true,
            };
          });
          if (pairs && pairs.length > 0) {
            return {
              result: pairs.map(pair =>
                marketList.find(market => market.pair === pair)
              ),
            };
          } else {
            return {
              result: marketList,
            };
          }
        });
      }
      return cache.fetch(`${BASE_URI}/data/v3/all/exchanges?api_key=${config.APIKey}&e=${exchangeSymbol}`,exchangeSymbol,{days: 1})
      .then(json => {
        let marketList = [];
        Object.keys(json.Data).forEach(exchangeId => {
          const exchangeInfos = json.Data[exchangeId];
          Object.keys(exchangeInfos.pairs).forEach(symbol => {
            exchangeInfos.pairs[symbol].forEach(quote => {
              marketList.push({
                id: `${exchangeId}__${symbol}/${quote}`,
                exchange: exchangeId,
                pair: `${symbol}/${quote}`,
                active: exchangeInfos.is_active,
              });
            });
          });
        });
        if (pairs && pairs.length > 0) {
          return {
            result: pairs.map(pair =>
              marketList.find(market => market.pair === pair)
            ),
          };
        } else {
          return {
            result: marketList,
          };
        }
      });
    },
  },
  market: {
    getPair: (marketId, config, cache) => {
      console.log("market.getPair");
      const idSplit = marketId.split("__");
      const pair = idSplit[1];
      const symbols = pair.split("/");
      const base = symbols[0];
      const quote = symbols[1];
      return cache.fetch(`${BASE_URI}/data/all/coinlist?api_key=${config.APIKey}`,"all",{days: 1})
      .then(json => {
        const coinList = Object.keys(json.Data).map(id => {
          const coinInfos = json.Data[id];
          return {
            symbol: coinInfos.Symbol,
            name: coinInfos.CoinName,
            isFiat: false,
          };
        }).concat(currenciesAsAssets);
        const baseInfos = coinList.find(coinInfos => coinInfos.symbol === base);
        const quoteInfos = coinList.find(coinInfos => coinInfos.symbol === quote);
        return {
          result: {
            symbol: pair,
            base: baseInfos,
            quote: quoteInfos,
          },
        };
      });
    },
    getExchange: (marketId, config, cache) => {
      console.log("market.getExchange");
      const idSplit = marketId.split("__");
      const exchange = idSplit[0];
      if (exchange === "CCCAGG") {
        return Promise.resolve({
          result: {
            symbol: "CCCAGG",
            name: "CryptoCompare",
            active: true,
          },
        });
      }
      return cache.fetch(`${BASE_URI}/data/exchanges/general?api_key=${config.APIKey}`,"all",{days: 1})
      .then(json => {
        const exchangeId = Object.keys(json.Data).find(id => json.Data[id].InternalName === exchange);
        const exchangeInfos = json.Data[exchangeId];
        return {
          result: {
            symbol: exchangeInfos.InternalName,
            name: exchangeInfos.Name,
            active: exchangeInfos.Trades,
          },
        };
      });
    },
    getOHLC: (marketId, params, config, cache) => {
      console.log("market.getOHLC");
      const idSplit = marketId.split("__");
      const exchange = idSplit[0];
      const pair = idSplit[1];
      const coins = pair.split("/");
      const base = coins[0];
      const quote = coins[1];
      const periodInfos = OHLC_PERIODS[params.period || "1d"]
      const paramsObj = {
        api_key: config.APIKey,
        e: exchange,
        fsym: base,
        tsym: quote,
      };
      let fullLimit = null;
      if (params.before) {
        paramsObj.toTs = params.before;
      }
      if (params.limit) {
        fullLimit = params.limit;
        params.after = null;
      } else if (params.after) {
        //TODO calculer timestamp correspondant
        const periodSecs = periodInfos.periodSecs;
        const totalSpan = (params.before || Math.floor(Date.now()/1000)) - params.after;
        fullLimit = Math.floor(totalSpan / periodSecs);
      }
      if (!params.after && !params.before && !params.limit && periodInfos.endpoint === "day") {
        paramsObj.allData = true;
      } else if (!params.after && !params.limit) {
        fullLimit = Infinity;
      }
      paramsObj.aggregate = periodInfos.aggregate;
      let OHLCArray = [];
      const ziFetchLoop = (isLooped, resolve, reject) => {
        if (fullLimit !== null) {
          paramsObj.limit = fullLimit>2000? 2000: fullLimit;
          fullLimit = fullLimit - 2000;
        }
        if (isLooped) {
          paramsObj.toTs = OHLCArray[0].timestamp - 1;
        }
        // console.log(paramsObj);
        return fetch(`${BASE_URI}/data/histo${periodInfos.endpoint}?${qs.stringify(paramsObj)}`)
        .then(res => res.json())
        .then(json => {
          let endOfTheRoad = false;
          if (!json.Data || !Array.isArray(json.Data)) {
            console.error("error fetching ohlc in cryptocompare");
            console.error(json);
            return reject("error fetching ohlc in cryptocompare");
          }
          OHLCArray = json.Data.map(ohlcMapping).concat(OHLCArray);
          let i = 0;
          while (i<OHLCArray.length && OHLCArray[i].close === 0 && OHLCArray[i].open === 0 && OHLCArray[i].volume === 0) {
            endOfTheRoad = true;
            i++;
          }
          if (endOfTheRoad) {
            console.log("end of road");
            console.log(OHLCArray.length, i);
            return resolve(OHLCArray.slice(i));
          }
          if (paramsObj.allData) {
            console.log("alldata");
            return resolve(OHLCArray);
          }
          if (fullLimit > 0) {
            return ziFetchLoop(true, resolve, reject);
          }
          return resolve(OHLCArray);
        })
      };
      return new Promise((resolve, reject) => {
        ziFetchLoop(false, res => resolve({result: res}), reject);
      });
    },
  },
  pair: {
    getMarkets: (pairSymbol, config, cache) => {
      console.log("pair.getmarkets");
      const coins = pairSymbol.split("/");
      const base = coins[0];
      return cache.fetch(`${BASE_URI}/data/v2/all/exchanges?api_key=${config.APIKey}&fsym=${base}`,base,{days: 1})
      .then(json => {
        let marketList = [];
        Object.keys(json.Data).forEach(exchangeId => {
          const exchangeInfos = json.Data[exchangeId];
          Object.keys(exchangeInfos.pairs).forEach(symbol => {
            exchangeInfos.pairs[symbol].forEach(quote => {
              marketList.push({
                id: `${exchangeId}__${symbol}/${quote}`,
                exchange: exchangeId,
                pair: `${symbol}/${quote}`,
                active: exchangeInfos.is_active,
              });
            });
          });
        });
        return {
          result: marketList.find(market => market.pair === pairSymbol),
        };
      });
    },
  },
};

let lastAllowanceCheck = null;

const allowanceWrapper = (interfaceFunc, getAllowance) => {
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
  const cache = createCache((data) => ({Data: data}), (json) => json.Data);
  return (allowanceMethods, ...interfaceArgs) => {
    if (allowanceMethods.get() < 2) {
      return new Error(`allowance low - ${
        allowanceMethods.get()
      }`);
    }
    return interfaceFunc(...interfaceArgs, cache)
    .then(({result, allowance}) => {
      if (allowance) {
        allowanceMethods.set(allowance.remaining);
        _updateAllowanceCost(allowance.cost);
        console.log(`new allowance: ${allowanceMethods.get()}`);
      } else if (!lastAllowanceCheck ||
        lastAllowanceCheck.add(createDuration(MAX_ALLOWANCE_AGE))
        .isBefore(moment())
      ) {
        lastAllowanceCheck = moment();
        getAllowance(interfaceArgs[interfaceArgs.length - 1])
        .then(allowance => {
          allowanceMethods.set(allowance.remaining);
          console.log(`new allowance (time polling): ${allowanceMethods.get()}`);
        });
      }
      return result;
    });
  };
};

const deepWrap = (methodsObject, target, getAllowance) => {
  if (!getAllowance) {
    target.getAllowance = methodsObject.getAllowance;
  }
  Object.keys(methodsObject).forEach(key => {
    if (key === "getAllowance") {
      return;
    }
    if (typeof methodsObject[key] === "function") {
      target[key] = allowanceWrapper(methodsObject[key], getAllowance || target.getAllowance);
    } else if (typeof methodsObject[key] === "object") {
      target[key] = {};
      deepWrap(methodsObject[key], target[key], getAllowance || target.getAllowance);
    }
  });
  return target;
};

module.exports = deepWrap(interfaceMethods, {});
