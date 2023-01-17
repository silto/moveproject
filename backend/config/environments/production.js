"use strict";

let env = process.env;
module.exports = {
  instance: "production",
  debug: false,
  listen: 80,
  logs: false,
  forceHttps: true,
  cookie: {
    maxAge: 31536000000,
    domain: env.COOKIE_DOMAIN || null,
    name: "movesid",
  },
  database: {
    settings: {
      "replset": {
        "strategy": "random",
        "read_secondary": true,
      },
    },
  },
  showEmailInConsole: false,
  smtp: { // SMTP Server
    sender: env.SMTP_SENDER,
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    service: env.SMTP_SERVICE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
    debug: false,
    tls: {rejectUnauthorized: false},
  },
  sms: {
    sender: env.SMS_SENDER,
    apiKey: env.SMS_APIKEY,
  },
  jobs: {
    backtest: {
      verbose: false,
    },
    moveDaily: {
      verbose: true,
    },
    btc: {
      verbose: true,
    },
  },
};
