/**
 * Development environment settings
 */

module.exports = {
  debug: true,
  beta: true,
  forceHttps: false,
  baseUrls: {
    api: "http://localhost:<%= listen %>",
    web: "http://localhost:<%= listen %>",
    front: "http://localhost:7050",
  },

  // ## Location=localhost not supported by Google Chrome
  // https://groups.google.com/a/chromium.org/forum/#!topic/chromium-bugs/4HFLDhvvXsc
  // You can only set domain cookies for registry controlled domains,
  // i.e. something ending in .com or so, but not IPs or intranet hostnames like localhost
  cookie: {
    domain: null,
  },

  database: {
    settings: {
      "db": {
        "reaperTimeout": 90000,
      },
      "server": {
        "slave_ok": true,
      },
      "replset": {
        "read_secondary": true,
      },
    },
  },
  showEmailInConsole: true,
};
