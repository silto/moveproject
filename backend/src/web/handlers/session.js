"use strict";
const config = require("../../../config");
const passport = require("passport");
const sanitize = require("../../lib/sanitizer");
const mongoose = require("mongoose");
const User = mongoose.model("User");

module.exports.index = function(req, res) {
  const productName = req.query && req.query.productName;
  let url = productName ? config.productsUrls[productName] : config.baseUrls.front;
  url = url ? url : config.baseUrls.front;
  let forwardedQueryString = `?${Object.keys(req.query).map(function mapQs(k) {
    return `${k}=${encodeURIComponent(req.query[k])}`;
  }).join("&")}`;
  res.header("location", url + forwardedQueryString);
  res.sendStatus(302);
};

module.exports.logout = function(req, res, next) {
  req.logout();
  req.session.destroy(function(err) {
    if (err) {
      return next(err);
    }
    res.clearCookie(config.cookie.name).json({logout: "ok"});
  });
};

module.exports.login = function(req, res, next) {
  let loginError = function loginError(err) {
    res.json({
      error: err,
    });
  };
  const afterAuth = function(err, user, info) {
    if (err) {
      config.debug && console.error(err);
      return loginError("ERROR");
    }
    if (!user) {
      config.debug && console.error(info.message);
      return loginError("USER_NOT_FOUND");
    }
    req.login(user, function(err) {
      if (err) {
        return loginError("ERROR");
      }
      res.json({signin: "ok"});
    });
  };
  if (req.body.userId) {
    passport.authenticate("local-userid", afterAuth)(req, res, next);
  } else {
    passport.authenticate("local", afterAuth)(req, res, next);
  }
};

// module.exports.redirectAfterLogin = function(req, res) {
//   const productName = req.query && req.query.productName;
//   let url = productName ? config.productsUrls[productName] : config.baseUrls.front;
//   url = url ? url : config.baseUrls.front;
//   res.header("location", `${url}`);
//   res.sendStatus(302);
// };

module.exports.signup = function(req, res) {
  let loginError = function loginError(err) {
    res.json({
      error: err,
    });
  };

  let completedBody = Object.assign({}, req.body);
  // body validation
  if (
    !completedBody ||
    !completedBody.firstname ||
    !completedBody.lastname ||
    !completedBody.email ||
    !completedBody.password ||
    !completedBody.phone ||
    !completedBody.phoneRegion
  ) {
    return loginError("MISSING_SIGNUP_INFORMATION");
  }
  if (completedBody.password.length < 6) {
    return loginError("INVALID_PASSWORD");
  }
  const email = completedBody.email.toLowerCase();
  let query = {
    mail: email,
  };
  return User.findOne(query)
  .read("primary")
  .exec()
  .then(existingUser => {
    if (
      existingUser &&
      existingUser.mail.toLowerCase() === email
    ){
      return loginError("ALREADY_USED_EMAIL");
    }
    const params = {
      mail: sanitize(email),
      pwd: completedBody.password,
      needEmailValidation: true,
    };
    return new Promise((resolve,reject) => User.createNew(params,{generateUsername: true}, (err, user) => {
      if (err) {
        config.debug && console.error(err);
        reject(err);
      } else {
        resolve(user);
      }
    }))
    .then((user) => (user.needEmailValidation? new Promise((resolve,reject) =>
      user.validateSignupEmail((err) => {
        if (err) {
          config.debug && console.error(err);
          return user.remove()
          .then(() => reject(new Error("mail error")));
        } else {
          resolve(user);
        }
      })) : Promise.resolve(user))
    )
    .then((user) => {
      req.login(user, function(err) {
        if (err) {
          return loginError("ERROR");
        }
        res.json({signup: "ok"});
      });
    });
  })
  .catch(err => {
    if (~err.message.indexOf("phone")) {
      return loginError("INVALID_PHONE");
    }
    if (err.message === "mail error") {
      return loginError("ERROR_SENDING_MAIL");
    }
    console.error(err);
    return loginError("ERROR");
  });
};

module.exports.checkEmailAvailability = function(req, res){
  const email = req.query && req.query.mail;
  if (email){
    return User.findOne({
      "$or": [
        {
          mail: email,
        },
        {
          mail: email.toLowerCase(),
        },
      ],
      isPartial: {$ne: true},
    })
    .exec()
    .then(user => {
      if (user){
        res.json({emailAvailable: false});
      } else {
        res.json({emailAvailable: true});
      }
    });
  }
};

module.exports.forgot = function(req, res) {
  let useCase;
  // TODO: better routing here
  if (req.body && req.body.email && !req.body.token && !req.body.password) {
    useCase = "askResetPassword";
  } else if (req.body && req.body.email && req.body.token && req.body.password) {
    useCase = "sendNewPassword";
  } else {
    res.json({error: "INVALID_REQUEST"});
    return;
  }
  switch (useCase) {
    case "askResetPassword":
      User.resetPassword(req.body.email, function(err) {
        if (err) {
          config.debug && console.error(err);
          res.json({error: "ERROR_SENDING_RESET_EMAIL"});
          return;
        }
        res.json({forgotEmail: "sent"});
      });
      break;
    case "sendNewPassword":
      User.changePassword(decodeURIComponent(req.body.email), req.body.token, req.body.password, function(err) {
        if (err) {
          config.debug && console.error(err);
          res.json({error: "ERROR_UPDATING_PASSWORD"});
          return;
        }
        res.json({passwordChange: "ok"});
      });
      break;
  }
};

module.exports.resendValidationEmail = function(req, res) {
  if (!req.query.userId) {
    res.json({error: "NO_USER_ID"});
  }
  User.findById(req.query.userId)
  .exec()
  .then(user =>
    new Promise((resolve) => {
      //eslint-disable-next-line eqeqeq
      if (user.nmail && user.nmail_token && req.query.isNew == 1) {
        user.validateNewEmail(resolve);
      } else if (user.needEmailValidation) {
        user.validateSignupEmail(resolve);
      }
    })
  ).then(err => {
    if (err) {
      config.debug && console.error(err);
      res.json({error: "ERROR_SENDING_MAIL"});
      return;
    }
    res.json({resend: "ok"});
  });
};
