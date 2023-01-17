/* eslint camelcase: 0 */

"use strict";
// This is the defaults when an environment didn't give its defaults before

module.exports = {
  serviceId: "MOVEAPI",
  serviceName: "MOVE Project API",
  instance: "localhost",
  listen: 5003,
  debug: true,
  logs: true,
  forceHttps: false,
  defaultLanguage: "EN",
  supportedLanguages: "FR,EN",
  productName: "MOVEProject",
  graphqlPath: "/graphql",
  baseUrls: {
    front: "http://localhost:7050",
    back: "http://localhost:5003",
    web: "http://localhost:5003",
  },
  productsUrls: {
    MOVEProject: "http://localhost:7050",
  },
  shortUrls: {
    MOVEProject: "http://localhost:7050",
  },
  productsFullNames: {
    MOVEProject: "MOVE Project",
  },
  noReplyEmail: "no-reply@moveproject.io",
  productNoReplyEmails: {
    MOVEProject: "no-reply@moveproject.io",
  },
  cookie: {
    maxAge: 31536000000,
    domain: ".moveproject.io",
    name: "movesid",
  },
  database: {
    uri: "mongodb://localhost:27017/moveproject",
  },
  redis: {
    url: "redis://moveproject@localhost:6379",
  },
  session: {
    url: "<%= redis.url %>",
    secret: `xxx`, // Note: never rely on this default on production
    ttl: 1209600, // Two Weeks@
    prefix: "move-project-sessions",
  },
  tokenEncryptionKey: "xxx",
  shortId: {
    alphabet: "abcdefghkmnoprstwxzABCDEFGHJKLMNPQRTWXY34689",
    len: 7,
    retries: 6,
  },
  priceDataInterface: "cryptocompare",
  interfacesConfig: {
    cryptocompare: {
      APIKey: "xxx",
    },
  },
  mailerlite: {
    APIKey: "xxx",
  },
  backtestTTL: 48,// number of hours the backtest documents are kept in db after ending
  jobs: { // always leave the 1h timeframe because it's used to control data integrity
    backtest: {
      enabled: true,
      verbose: true,
    },
    moveDaily: {
      chainWithBTCQueue: true,
      verbose: true,
      hour: "7",
      minute: "5",
      timeframes: "1m,5m,15m,1h",
    },
    moveWeekly: {
      hour: "0",
      minute: "6",
      timeframes: "15m,1h,4h,1d",
    },
    moveQuarterly: {
      hour: "3",
      minute: "3",
      timeframes: "1h,4h,1d,1w",
    },
    btc: {
      enabled: true,
      verbose: true,
      priceDataInterface: "ftx",
      hour: "0",
      minute: "3",
      maxTimestamp: "1568592000",// make sure this is a start of week
      timeframes: "1m,5m,15m,1h,4h,1d",
    },
  },
  rateLimits: {
    backtest: {
      ip: {
        points: 50,
        duration: 24,
        blockDuration: 24,
      },
      // user: {
      //   points: 10,
      //   duration: 24 * 30,//1 mth
      //   blockDuration: 1,
      // },
    },
  },
};
