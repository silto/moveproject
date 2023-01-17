"use strict";

const uid = require("uid-safe").sync;

module.exports.sessionGenId = (req) => {
  if (req.userId) {
    return `${uid(24)}:${req.userId}`;
  }
  return uid(24);
};

//adds functiopns to the redisClient to facilitate session handling

module.exports.redisEnhance = function(RedisClient) {
  //add a scan feature to get all of a user's sessions
  RedisClient.prototype.getAllUserSessionIDs = function(id, cb) {
    const store = this;
    let keysObj = {}; // Use an object to dedupe as scan can return duplicates
    const pattern = `${store.prefix}*:${id}`;
    (function nextBatch (cursorId) {
      store.client.scan(cursorId, "match", pattern, "count", 100, function (err, result) {
        if (err) {
          return cb(err);
        }

        const nextCursorId = result[0];
        const keys = result[1];

        keys.forEach(function (key) {
          keysObj[key.substr(store.prefix.length)] = 1;
        });
        // eslint-disable-next-line eqeqeq
        if (nextCursorId != 0) {
          // next batch
          return nextBatch(nextCursorId);
        }

        // end of cursor
        return cb(null, Object.keys(keysObj));
      });
    })(0);
  };
};

//adds functiopns to the Session class to facilitate session handling

module.exports.sessionEnhance = function(Session) {
  function defineMethod(obj, name, fn) {
    Object.defineProperty(obj, name, {
      configurable: true,
      enumerable: false,
      value: fn,
      writable: true,
    });
  }

  defineMethod(Session.prototype, "uniq", function uniq(fn) {
    if (!this.user) {
      fn && fn("no user attached to this session");
    } else {
      this.req.sessionStore.getAllUserSessionIDs(this.user._id.toString(), (err, sessionIds) => {
        if (sessionIds.length > 1) {
          this.req.sessionStore.destroy(sessionIds.filter(id => id !== this.id), (err) => {
            if (err) {
              console.error(err);
              fn && fn(err);
              return;
            }
            fn && fn();
          });
        }
      });
    }
    return this;
  });
};
