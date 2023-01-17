/* eslint camelcase: 0 */

"use strict";
// This is the config structure filled with env variables

let env = process.env;
module.exports = {
  instance: env.INSTANCE_NAME, // The instance name to return in headers
  listen: env.PORT, // Bound port for the Express Server
  debug: env.DEBUG && env.DEBUG === "true", // Whether debug information should be outputted
  logs: env.LOGS && env.LOGS === "true", // Whether Express logs should be outputted
  defaultLanguage: env.DEFAULT_LANGUAGE,
  supportedLanguages: env.SUPPORTED_LANGUAGES,
  productName: env.PRODUCT_NAME,
  allowedEmails: env.ALLOWED_EMAILS,
  graphqlPath: env.GRAPHQL_PATH,
  baseUrls: {
    front: env.MOVE_FRONT_URL,
    back: env.API_URL,
    web: env.API_URL,
  },
  productsUrls: {
    MOVEProject: env.MOVE_FRONT_URL,
  },
  shortUrls: {
    MOVEProject: env.MOVE_SHORT_URL,
  },
  productsFullNames: {
    MOVEProject: env.MOVE_PRODUCT_FULL_NAME,
  },
  noReplyEmail: env.NO_REPLY_EMAIL,
  productNoReplyEmails: {
    MOVEProject: env.NO_REPLY_EMAIL_MOVE,
  },
  cookie: { // Cookie lifecycle control
    maxAge: env.COOKIE_MAX_AGE,
    domain: env.COOKIE_DOMAIN,
    name: env.COOKIE_NAME,
  },
  database: { // MongoDB Database Connection
    uri: env.DB_URI,
  },
  redis: { // Redis Session Server Connection
    url: env.REDIS_URL,
  },
  session: {
    url: env.REDIS_URL,
    secret: env.SESSION_SECRET,
    ttl: env.SESSION_TTL,
    prefix: env.SESSION_PREFIX,
  },
  tokenEncryptionKey: env.TOKEN_ENCRYPTION_KEY,
  shortId: {
    alphabet: env.SHORTID_ALPHABET,
    len: env.SHORTID_LENGTH,
    retries: env.SHORTID_RETRIES,
  },
  priceDataInterface: env.PRICE_DATA_INTERFACE,
  interfacesConfig: {
    cryptocompare: {
      APIKey: env.API_KEY_CRYPTOCOMPARE,
    },
  },
  mailerlite: {
    APIKey: env.MAILERLITE_API_KEY,
  },
  backtestTTL: env.BACKTEST_TTL && parseInt(env.BACKTEST_TTL),
  jobs: {
    backtest: {
      enabled: env.JOB_BACKTEST_ENABLED && env.JOB_BACKTEST_ENABLED === "true",
      verbose: env.JOB_BACKTEST_VERBOSE,
    },
    moveDaily: {
      chainWithBTCQueue: env.JOB_MOVEDAILY_CHAIN_WITH_BTC_QUEUE,
      verbose: env.JOB_MOVEDAILY_VERBOSE,
      hour: env.JOB_MOVEDAILY_HOUR,
      minute: env.JOB_MOVEDAILY_MINUTE,
      periods: env.JOB_MOVEDAILY_TIMEFRAMES,
    },
    moveWeekly: {
      hour: env.JOB_MOVEWEEKLY_HOUR,
      minute: env.JOB_MOVEWEEKLY_MINUTE,
      periods: env.JOB_MOVEWEEKLY_TIMEFRAMES,
    },
    moveQuarterly: {
      hour: env.JOB_MOVEQUARTERLY_HOUR,
      minute: env.JOB_MOVEQUARTERLY_MINUTE,
      periods: env.JOB_MOVEQUARTERLY_TIMEFRAMES,
    },
    btc: {
      enabled: env.JOB_BTC_ENABLE,
      verbose: env.JOB_BTC_VERBOSE,
      hour: env.JOB_BTC_HOUR,
      minute: env.JOB_BTC_MINUTE,
      maxTimestamp: env.JOB_BTC_MAX_TIMESTAMP,
      timeframes: env.JOB_BTC_TIMEFRAMES,
    },
  },
  rateLimits: {
    backtest: {
      ip: {
        points: env.RATE_LIMITS_BACKTEST_IP_POINTS,
        duration: env.RATE_LIMITS_BACKTEST_IP_DURATION,
        blockDuration: env.RATE_LIMITS_BACKTEST_IP_BLOCKDURATION,
      },
    },
  },
};
