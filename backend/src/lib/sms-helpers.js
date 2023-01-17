"use strict";

const fetch = require("node-fetch");
const config = require("../../config");

const API_URL = config.sms.apiUrl;
const transactionalSMSUrl = `${API_URL}/transactionalSMS/sms`;

const expect = function(response) {
  if (response.status === 400) {
    return response.json().then(function(obj) {
      let err = new Error(`SMS bad request (${obj.code}): ${obj.message}`);
      return Promise.reject(err);
    },() => {
      return response.text().then(function(msg) {
        let err = new Error(`SMS bad request: ${msg.indexOf("<!DOCTYPE html>") !== -1? "" : msg}`);
        return Promise.reject(err);
      });
    });
  } else if (response.status === 402) {
    return response.json().then(function(obj) {
      let err = new Error(`SMS not enough credit (${obj.code}): ${obj.message}`);
      return Promise.reject(err);
    },() => {
      return response.text().then(function(msg) {
        let err = new Error(`SMS not enough credit: ${msg.indexOf("<!DOCTYPE html>") !== -1? "" : msg}`);
        return Promise.reject(err);
      });
    });
  } else if (response.status > 400) {
    return response.json().then(function(obj) {
      let err = new Error(`SMS error (status: ${response.status}) (${obj.code}): ${obj.message}`);
      return Promise.reject(err);
    },() => {
      return response.text().then(function(msg) {
        let err = new Error(`SMS error (status: ${response.status}): ${msg.indexOf("<!DOCTYPE html>") !== -1? "" : msg}`);
        return Promise.reject(err);
      });
    });
  } else {
    return Promise.resolve(response);
  }
};

const sendSMS = module.exports.sendSMS = function(user, data, callback) {
  config.debug && console.log("Sending sms to", data.to);

  const smsOptions = {
    recipient: data.to || (user && user.phone),
    sender: data.sender || config.sms.sender,
    type: "transactional",
    content: data.content,
  };
  config.debug && console.log(smsOptions);
  if (data.tag) {
    smsOptions.tag = data.tag;
  }
  if (!config.sms.apiKey) {
    console.log(`SMS not sent (NO API KEY)`);
    console.log(`SMS content: ${data.content}`);
    return callback && callback();
  }
  fetch(transactionalSMSUrl, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "api-key": config.sms.apiKey,
    },
    body: JSON.stringify(smsOptions),
  })
  .then(expect)
  .then(res => res.json())
  .then(json => {
    config.debug && console.log(`SMS sent ref: ${
      json.reference
    }, id: ${
      json.messageId
    }, count: ${
      json.smsCount
    }, credits: ${
      json.usedCredits
    } used/${
      json.remainingCredits
    } remaining`);
    callback && callback();
  })
  .catch(err => {
    config.debug && console.error(err);
    callback && callback(err);
  });
};

let TRANSLATIONS_TO_CACHE = {
  "GenerousConnect": [
    "new-phone-code",
    "donation-notif-asso",
    "donation-notif-noasso",
  ],
  DonDuClic: "GenerousConnect",
};

let CACHED_TRANSLATIONS = {};
Object.keys(TRANSLATIONS_TO_CACHE).forEach(productName => {
  let product = productName;
  if (typeof TRANSLATIONS_TO_CACHE[productName] === "string") {
    product = TRANSLATIONS_TO_CACHE[productName];
  }
  CACHED_TRANSLATIONS[productName] = TRANSLATIONS_TO_CACHE[product].reduce(function(cache, filePath) {
    cache[filePath] = require(`../shared/sms/${product}/${filePath}.json`);
    return cache;
  }, {});
});
const formatAndSendSMS = function(params, callback) {
  const productTranslationCache = CACHED_TRANSLATIONS[params.productName] || CACHED_TRANSLATIONS[config.productName];
  let smsLanguages = productTranslationCache[params.smsType];
  let language = params.language || (params.user && params.user.language && params.user.language.toUpperCase()) || config.defaultLanguage;
  let smsText = smsLanguages && smsLanguages[language];
  if (!smsText) {
    smsText = smsLanguages[config.defaultLanguage];
  }
  if (!smsText) {
    return callback && callback("error getting sms file");
  }
  // Default variables
  params.vars = params.vars || {};
  params.vars.hostname = params.vars.hostname || config.baseUrls.web;
  params.vars.gcUrl = config.productsUrls.GenerousConnect;
  params.vars.hostfront = params.vars.hostfront || config.productsUrls[params.productName] || config.baseUrls.front;
  params.vars.handle = params.vars.handle || (params.user && params.user.firstName);
  params.vars.productUrl = config.productsUrls[params.vars.productName];
  params.vars.productName = params.productName;
  params.vars.productFullName = params.productFullName;
  // Replace variables in mail templates
  Object.keys(params.vars).forEach(variable => {
    //eslint-disable-next-line prefer-template
    let pattern = `{{\\s*${variable}(?:\\|\\[(.*)\\])?\\s*}}`;
    smsText = smsText.replace(new RegExp(pattern, "g"), params.vars[variable] || "$1" || "");
  });

  let smsData = {
    content: smsText,
    sender: params.sender,
    to: params.to || null,
  };
  sendSMS(params.user, smsData, function() {
    callback && callback();
  });
};

exports.sendSMSCode = function(user, callback) {
  const productName = user.productName || config.productName;
  const productFullName = config.productsFullNames[productName];
  const productShortName = config.productShortNames[productName];
  formatAndSendSMS({
    productName,
    productFullName,
    smsType: `new-phone-code`,
    user: user,
    to: user.phone,
    sender: productShortName,
    vars: {
      code: user.newPhoneToken,
      productName,
      productFullName,
    },
  }, callback);
};

exports.sendDonationNotification = function(infos, callback) {
  const productName = infos.productName || config.productName;
  const productFullName = config.productsFullNames[productName];
  const productShortName = config.productShortNames[productName];
  const shortUrl = config.shortUrls[productName];
  let redirectUrl = `${shortUrl}/d/${infos.donationOpt.shortId}`;
  let smsText;
  let motive;
  let infocompl;
  if (infos.donationCampaign && infos.donationCampaign.presentations) {
    let presForLanguage = infos.donationCampaign.getPresentationForLanguage(infos.language);
    motive = presForLanguage.pitch;
    infocompl = presForLanguage.infocompl || "";
  }

  if (infos.asso) {
    smsText = "donation-notif-asso";
    redirectUrl = shortUrl;
  } else {
    smsText = "donation-notif-noasso";
    redirectUrl = `${shortUrl}/d/${infos.donationOpt.shortId}`;
  }
  formatAndSendSMS({
    productName,
    productFullName,
    smsType: smsText,
    to: infos.phone,
    language: infos.language,
    sender: productShortName,
    vars: {
      redirectUrl,
      email: infos.mail,
      productName,
      productFullName,
      announcerName: infos.announcer.name,
      handle: infos.handle,
      motive,
      infocompl,
      amount: infos.donationOpt.amount || (infos.donationCampaign && infos.donationCampaign.defaultAmount),
      assoName: infos.asso && infos.asso.name,
    },
  }, callback);
};
