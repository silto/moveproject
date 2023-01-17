"use strict";
const mongoose = require("mongoose");
const User = mongoose.model("User");
const config = require("../../../config");

const confirmSignupEmail = function(req, res) {
  const productUrl = config.baseUrls.front;
  if (!req.query.id || !req.query.token) {
    res.header("location", `${productUrl}/login?state=emailverification&error=MALFORMED_REQUEST`);
    res.sendStatus(302);
    return;
  }
  User.findOne({
    "_id": req.query.id,
  }).exec()
  .then(user => {
    if (user && user.needEmailValidation) {
      if (!user.verifySignupMailToken(req.query.token)) {
        return Promise.reject("TOKEN_ERROR");
      }
      return user;
    } else {
      return Promise.reject("SERVER_ERROR");
    }
  })
  .then(user => {
    user.needEmailValidation = false;
    user.signupMailToken = undefined;
    return new Promise((resolve, reject) =>{
      user.save(function(err){
        if (err) {
          return reject("DB_ERROR");
        } else {
          resolve(user);
        }
      });
    });
  })
  .then((user) => {
    res.header("location", `${productUrl}/login?state=emailverification&email=${user.mail}`);
    res.sendStatus(302);
  })
  .catch(err => {
    res.header("location", `${productUrl}/login?state=emailverification&error=${err}`);
    res.sendStatus(302);
  });
};

module.exports = confirmSignupEmail;
