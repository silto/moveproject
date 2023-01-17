"use strict";
// cryptocompare API wrapper
const fetch = require("node-fetch");
const moment = require("moment");
const INFTIME = 1e11;

const createDuration = module.exports.createDuration = (duration) => {
  return typeof duration === "object"?
    moment.duration(duration) :
    moment.duration(duration, "seconds");
};

module.exports.createCache = (mapping = (res) => res, extractor = (json) => json.res) => {
  return {
    _cache: {},
    set: function(key = "all", res) {
      this._cache[key] = {
        res,
        timestamp: moment(),
      };
    },
    setPending: function(key = "all") {
      this._cache[key] = {pending: true, waitingList: [], timestamp: moment()};
    },
    resolvePending: function(key = "all", res) {
      if (this._cache[key].pending) {
        this._cache[key].waitingList.forEach(cb => cb(res));
      }
    },
    isPending: function(key = "all") {
      return this._cache[key] && this._cache[key].pending;
    },
    addToWaitingList: function(key = "all", callback) {
      if (this._cache[key].pending) {
        this._cache[key].waitingList.push(callback);
      }
    },
    hasKey: function(key = "all", maxAge = INFTIME) {
      if (!this._cache[key]) {
        return false;
      }
      const maxAgeDuration = createDuration(maxAge);
      if (this._cache[key].timestamp.add(maxAgeDuration).isBefore(moment())) {
        return false;
      }
      return true;
    },
    get: function(key = "all", maxAge = INFTIME) {
      if (!this._cache[key]) {
        return null;
      }
      const maxAgeDuration = createDuration(maxAge);
      if (this._cache[key].timestamp.add(maxAgeDuration).isBefore(moment())) {
        return null;
      }
      return this._cache[key].res;
    },
    fetch: function(url, key = "all", maxAge = INFTIME) {
      if (this.hasKey(key, maxAge)) {
        if (this.isPending(key)) {
          return new Promise((resolve) => {
            this.addToWaitingList(key, (res) => resolve(mapping(res)));
          });
        } else {
          return Promise.resolve(mapping(this.get(key)));
        }
      } else {
        this.setPending(key);
        return fetch(url)
        .then(res => res.json())
        .then(json => {
          this.resolvePending(key, extractor(json));
          this.set(key, extractor(json));
          return json;
        });
      }
    },
  };
};
