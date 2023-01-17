"use strict";
const config = require("../../../config");
const sanitize = require("../../lib/sanitizer");
const fetch = require("node-fetch");
const emailRegex = /^.+@.+\..+/;

module.exports.subscribe = function(req, res) {
  if (!req.body) {
    config.debug && console.error("failed newletter subscription (no body)");
    res.json({error: "INVALID_EMAIL"});
    return;
  }
  const cleanEmail = sanitize(req.body.email);
  if (!emailRegex.test(cleanEmail)) {
    res.json({error: "INVALID_EMAIL"});
    return;
  }
  fetch("https://api.mailerlite.com/api/v2/subscribers", {
    method: "post",
    body: JSON.stringify({email: cleanEmail}),
    headers: {
      "Content-Type": "application/json",
      "X-MailerLite-ApiKey": config.mailerlite.APIKey,
    },
  })
  .then(res => res.json())
  .then(json => {
    if (!json.id) {
      res.json({error: "ERROR_MAIL_PROVIDER"});
      return;
    }
    res.json({subscribe: "ok"});
  });
};
