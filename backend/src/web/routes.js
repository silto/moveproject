"use strict";
/**
 * Web Routes
 */
const forceHttps = require("../middlewares").forceHttps;
const session = require("./handlers/session");
const newsletter = require("./handlers/newsletter");
const confirmEmail = require("./handlers/confirm-email");
const confirmSignupEmail = require("./handlers/confirm-signup-email");

module.exports.map = function(app) {
  app.get("/", forceHttps, session.index);

  // Sign out management
  app.get("/forgot", forceHttps, session.forgot);
  app.post("/forgot", forceHttps, session.forgot);
  app.post("/login", forceHttps, session.login);
  // app.post("/2fa", forceHttps, helpers.checkLogin, session.twoFactor);
  // app.post("/recoveryCode", forceHttps, helpers.checkLogin, session.recoveryCode);
  app.get("/logout", forceHttps, session.logout);
  app.post("/signup", forceHttps, session.signup);
  app.get("/checkEmailAvailability", forceHttps, session.checkEmailAvailability);
  app.get("/confirm-email", confirmEmail);
  app.get("/confirm-signup-email", confirmSignupEmail);
  app.get("/resendValidationEmail", session.resendValidationEmail);
  app.post("/subscribe", forceHttps, newsletter.subscribe);
};
