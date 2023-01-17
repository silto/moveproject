"use strict";
const mongoose = require("mongoose");
const User = mongoose.model("User");
const config = require("../../../config");

const confirmEmail = function(req, res, next) {
  if (!req.query.id || !req.query.token) {
    return next(new Error("missing argument"));
  }
  const productUrl = config.baseUrls.front;
  User.findOne({
    "_id": req.query.id,
  }).exec()
  .then(user => {
    // Check if the given token is correct, and if the mail was sent less than 1 day ago
    if (user && user.nmail) {
      if (!user.verifyNmailToken(req.query.token)) {
        return Promise.reject("TOKEN_ERROR");
      }
      return user;
    } else {
      return Promise.reject("SERVER_ERROR");
    }
  })
  .then(user => {
    user.mail = user.nmail;
    user.nmail = undefined;
    //eslint-disable-next-line camelcase
    user.nmail_date = undefined;
    //eslint-disable-next-line camelcase
    user.nmail_token = undefined;
    user.needEmailValidation = false;
    user.signupMailToken = undefined;
    return new Promise((resolve, reject) =>{
      user.save(function(err){
        if (err) {
          return reject("DB_ERROR");
        } else {
          resolve(user.mail);
        }
      });
    });
  })
  .then(user => {
    res.header("location", `${productUrl}/login?state=emailconfirmation&email=${user.mail}`);
    res.sendStatus(302);
  })
  .catch(err => {
    res.header("location", `${productUrl}/login?state=emailconfirmation&error=${err}`);
    res.sendStatus(302);
  });
};

module.exports = confirmEmail;
