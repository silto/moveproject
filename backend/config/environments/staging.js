// TODO: transfert all of this to hk env variables

let env = process.env;
module.exports = {
  instance: "staging",
  forceHttps: true,

  cookie: {
    maxAge: 31536000000,
    domain: env.COOKIE_DOMAIN || null,
    name: "ddcssid",
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
    debug: env.SMTP_DEBUG,
    tls: {rejectUnauthorized: false},
  },
  sms: {
    sender: env.SMS_SENDER,
    apiKey: env.SMS_APIKEY,
  },
};
