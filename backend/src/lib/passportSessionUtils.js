"use strict";
const LocalStrategy = require("passport-local").Strategy;
const {userDataLoader} = require("../dataloaders/user");
const mongoose = require("mongoose");
const User = mongoose.model("User");
const config = require("../../config");
const {
  ObjectId,
} = mongoose.Types;

module.exports.passportEnhance = function(passport) {
  passport.serializeUser(function(user, done) {
    done(null, user._id.toString());
  });

  passport.deserializeUser(function(id, done) {
    userDataLoader.load(id)
    .then(user => {
      if (!user) {
        return done(null, null);
      }
      // Req.session.user become a mongoose object.
      user.updateOne({lastPing: Date.now()}).exec();
      done(null, user);
    }, (e) => {
      config.debug && console.error(e);
      done(null, null);
    });
  });
};

module.exports.passportLoadStrategies = function(passport) {
  passport.use("local", new LocalStrategy(
    {
      usernameField: "username",
      passwordField: "password",
    },
    function(username, password, done) {
      if (!username || !password) {
        return done(null, false, { message: "MISSING_CREDENTIALS"});
      }
      let field = ~username.indexOf("@") ? "mail" : "username";
      let query = {};
      if (field === "mail") {
        query = {
          "$or": [
            {
              mail: username,
            },
            {
              mail: username.toLowerCase(),
            },
          ],
        };
      } else {
        query = {
          username,
        };
      }

      User.findOne(query)
      .exec()
      .then(user => {
        if (!user) {
          return done(null, false, { message: "INVALID_USERNAME" });
        }
        if (user.isPartial) {
          return done(null, false, { message: "NOT_SIGNED_UP" });
        }
        if (!user.pwd || (user.pwd && !user.verifyPwd(password))) {
          return done(null, false, { message: "INVALID_PASSWORD" });
        }
        return done(null, user);
      })
      .catch(err => {
        return done(err);
      });
    }
  ));
  passport.use("local-userid", new LocalStrategy(
    {
      usernameField: "userId",
      passwordField: "password",
    },
    function(userId, password, done) {
      if (!userId || !password) {
        return done(null, false, { message: "MISSING_CREDENTIALS"});
      }
      if (!mongoose.isValidObjectId(userId)) {
        return done(null, false, { message: "INVALID_ID"});
      }

      User.findOne({
        _id: new ObjectId(userId),
      })
      .exec()
      .then(user => {
        if (!user) {
          return done(null, false, { message: "INVALID_ID" });
        }
        if (user.isPartial) {
          return done(null, false, { message: "NOT_SIGNED_UP" });
        }
        if (!user.pwd || (user.pwd && !user.verifyPwd(password))) {
          return done(null, false, { message: "INVALID_PASSWORD" });
        }
        return done(null, user);
      })
      .catch(err => {
        return done(err);
      });
    }
  ));
};
