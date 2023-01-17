/* @flow */

const ENV = process.env;

const CONFIG_DEFAULTS = {
  port: (ENV.PORT && parseInt(ENV.PORT)) || 7050,
  source: "",
  NODE_ENV: "development",
  API_URL: "http://localhost:5003",
  APP_URL: "http://localhost:7050",
  APP_PATH: "/",
  MATOMO_DOMAIN: "xxx",
  MATOMO_JS_DOMAIN: "xxx",
  APP_NAME: "MOVE Project",
  debug: ENV.DEBUG === "false"? false : true,
  graphqlPath: ENV.GRAPHQL_PATH || "/graphql",
  defaultLanguage: ENV.DEFAULT_LANGUAGE || "EN",
  defaultCountry: ENV.DEFAULT_LANGUAGE || "EN",
  supportedLanguages: ENV.SUPPORTED_LANGUAGES || "EN",
  forceHttps: ENV.FORCE_HTTPS === "true" || false,
  maintenance: ENV.MAINTENANCE === "true" || false,
  defaultDisplayedTimeframe: {
    moveDaily: "2D" || ENV.MOVEDAILY_DISPLAYED_TIMEFRAMES,
  },
  availableTimeframes: {
    moveDaily: "1m,5m,15m,1h" || ENV.MOVEDAILY_TIMEFRAMES,
    btc: "1m,5m,15m,1h,4h,1d" || ENV.BTC_TIMEFRAMES,
  },
  choicesTimeframes: {
    moveDaily: "1m,3m,5m,15m,30m,1h,2h" || ENV.MOVEDAILY_CHOICES_TIMEFRAMES,
    btc: "1m,3m,5m,15m,30m,1h,2h,4h,1d" || ENV.BTC_CHOICES_TIMEFRAMES,
  },
  defaultTimeframes: {
    moveDaily: "15m",
  },
  referralCode: "silto",
  firstMOVE: {
    openAsFutureDate: "2019-09-24T00:00:00.000Z",
    openDate: "2019-09-25T00:00:00.000Z",
    closeDate: "2019-09-26T00:00:00.000Z",
  },
  showBTCData: ENV.SHOW_BTC_DATA === "false"? false : true,
  showBacktesting: ENV.SHOW_BACKTESTING === "false"? false : true,
};

// Non-ES6 module as it can be required by the server as well!
const config/*: any */ = Object.assign({}, CONFIG_DEFAULTS, ENV);
module.exports = config;
