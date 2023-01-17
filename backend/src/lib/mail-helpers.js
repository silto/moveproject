"use strict";

const nodemailer = require("nodemailer");
const fs = require("fs");
const ejs = require("ejs");
const config = require("../../config");

const transporter = nodemailer.createTransport(config.smtp);

const sendMail = module.exports.sendMail = function(user, data, callback) {
  config.debug && console.log("Sending mail notification to", data.to);
  if (config.showEmailInConsole) {
    console.log(data.text);
    callback && callback(null);
  } else {
    const mailOptions = {
      headers: data.headers || {},
      from: data.sender || config.smtp.sender,
      to: data.to || (user && user.mail),
      subject: data.subject,
      html: data.html,
      text: data.text,
    };

    transporter.sendMail(mailOptions, function(error) {
      if (error) {
        console.error(`Error sending mail to: ${mailOptions.to}`);
        console.error(`Error: ${error}`);
      }
      callback && callback(error);
    });
  }
};

let FILES_TO_CACHE = {
  "MOVEProject": [
    "generic-new",
    "generic-text",
  ],
};

let CACHED_FILES = {};
Object.keys(FILES_TO_CACHE).forEach(productName => {
  let product = productName;
  if (typeof FILES_TO_CACHE[productName] === "string") {
    product = FILES_TO_CACHE[productName];
  }
  CACHED_FILES[productName] = FILES_TO_CACHE[product].reduce(function(cache, filePath) {
    cache[filePath] = fs.readFileSync(`./src/shared/emails/${product}/${filePath}.ejs`, "utf8");
    return cache;
  }, {});
});

let TRANSLATIONS_TO_CACHE = {
  "MOVEProject": [
    "add-password",
    "confirm-email",
    "confirm-signup-email",
    "reset-password",
  ],
};

let CACHED_TRANSLATIONS = {};
Object.keys(TRANSLATIONS_TO_CACHE).forEach(productName => {
  let product = productName;
  if (typeof TRANSLATIONS_TO_CACHE[productName] === "string") {
    product = TRANSLATIONS_TO_CACHE[productName];
  }
  CACHED_TRANSLATIONS[productName] = TRANSLATIONS_TO_CACHE[product].reduce(function(cache, filePath) {
    cache[filePath] = require(`../shared/emails/${product}/translations/${filePath}.json`);
    return cache;
  }, {});
});
const formatAndSendMail = function(params, callback) {
  const productCache = CACHED_FILES[params.productName] || CACHED_FILES[config.productName];
  const productTranslationCache = CACHED_TRANSLATIONS[params.productName] || CACHED_TRANSLATIONS[config.productName];
  let ejsStr = productCache[params.ejsFile];
  let textEjsStr = productCache[params.ejsTextFile];
  let ejsRawData = productTranslationCache[params.translationFile];
  let language = params.language || (params.user && params.user.language && params.user.language.toUpperCase()) || config.defaultLanguage;
  let ejsData = ejsRawData && ejsRawData[language];
  if (!ejsData) {
    ejsData = ejsRawData[config.defaultLanguage];
  }
  if (!ejsStr || !textEjsStr || !ejsRawData || !ejsData) {
    return callback && callback("error getting email files");
  }
  if (!ejsData.options) {
    ejsData.options = {};
  }
  let html, text, subject;
  try {
    html = ejs.render(ejsStr, ejsData);
    text = ejs.render(textEjsStr, ejsData);
    subject = ejsData.subject;
  } catch (e) {
    return callback && callback(`error rendering email:
${e}`);
  }

  // Default variables
  params.vars = params.vars || {};
  params.vars.hostname = params.vars.hostname || config.baseUrls.web;
  params.vars.gcUrl = config.productsUrls.GenerousConnect;
  params.vars.hostfront = params.vars.hostfront || config.productsUrls[params.productName] || config.baseUrls.front;
  params.vars.handle = params.vars.handle || (params.user && params.user.firstName);
  if (ejsData.intro) {
    params.vars.intro = ejsData.intro.withHandle?
      (params.vars.handle ?
        ejsData.intro.withHandle.replace(/{{\s*handle\s*}}/, params.vars.handle) :
        ejsData.intro.withoutHandle
      ) :
      ejsData.intro;
  }
  params.vars.productName = params.productName;
  params.vars.productFullName = params.productFullName;
  params.vars.productUrl = config.productsUrls[params.vars.productName];
  params.vars.productUrlClean = config.productsUrls[params.vars.productName].replace(/https?:\/\//,"");

  // Replace variables in mail templates
  Object.keys(params.vars).forEach(variable => {
    //eslint-disable-next-line prefer-template
    let pattern = `{{\\s*${variable}(?:\\|\\[(.*)\\])?\\s*}}`;
    html = html.replace(new RegExp(pattern, "g"), params.vars[variable] || "$1" || "");
    text = text.replace(new RegExp(pattern, "g"), params.vars[variable] || "$1" || "");
    subject = subject.replace(new RegExp(pattern, "g"), params.vars[variable] || "$1" || "");
  });
  text = text.replace(/<.*?>/g, "");
  let h = {
    "X-Mailjet-Campaign": params.campaign,
    "X-Mailjet-DeduplicateCampaign": params.deduplicateCampaign || "true",
  };
  let mailData = {
    headers: h,
    subject: subject,
    html: html,
    text: text,
    sender: params.sender,
    to: params.to || null,
  };
  sendMail(params.user, mailData, function(e) {
    callback && callback(e);
  });
};


exports.sendChangedMailMail = function(user, callback) {
  const productName = user.productName || config.productName;
  const productFullName = config.productsFullNames[productName];

  formatAndSendMail({
    productName,
    productFullName,
    ejsFile: `generic-new`,
    ejsTextFile: `generic-text`,
    translationFile: `confirm-email`,
    campaign: `${productFullName} Email Confirmation`,
    deduplicateCampaign: "false",
    user: user,
    to: user.nmail,
    vars: {
      id: user.id,
      email: user.nmail,
      token: user.nmail_token,
      productName,
      productFullName,
    },
    sender: `${productFullName} <${config.noReplyEmail}>`,
  }, callback);
};


exports.sendConfirmSignupMail = function(user, callback) {
  const productName = user.productName || config.productName;
  const productFullName = config.productsFullNames[productName];

  formatAndSendMail({
    productName,
    productFullName,
    ejsFile: `generic-new`,
    ejsTextFile: `generic-text`,
    translationFile: `confirm-signup-email`,
    campaign: `${productFullName} Email Confirmation`,
    deduplicateCampaign: "false",
    user: user,
    to: user.mail,
    vars: {
      id: user.id,
      email: user.mail,
      token: user.signupMailToken,
      asso: user.assoSupported && user.assoSupported[0] && user.assoSupported[0].name,
      productName,
      productFullName,
    },
    sender: `${productFullName} <${config.noReplyEmail}>`,
  }, callback);
};

exports.sendResetPasswordMail = function(user, callback) {
  const productName = user.productName || config.productName;
  const productFullName = config.productsFullNames[productName];
  formatAndSendMail({
    productName,
    productFullName,
    ejsFile: `generic-new`,
    ejsTextFile: `generic-text`,
    translationFile: `reset-password`,
    campaign: `${productFullName} Password Reset`,
    deduplicateCampaign: "false",
    user: user,
    to: user.mail,
    vars: {
      email: encodeURIComponent(user.mail),
      token: user.npwd_token,
      productName,
      productFullName,
    },
    sender: `${productFullName} <${config.noReplyEmail}>`,
  }, callback);
};

exports.sendAddPasswordMail = function(user, callback) {
  const productName = user.productName || config.productName;
  const productFullName = config.productsFullNames[productName];

  formatAndSendMail({
    productName,
    productFullName,
    ejsFile: `generic-new`,
    ejsTextFile: `generic-text`,
    translationFile: `add-password`,
    campaign: `${productFullName} Password Creation`,
    deduplicateCampaign: "false",
    user: user,
    to: user.mail,
    vars: {
      email: encodeURIComponent(user.mail),
      token: user.npwd_token,
      productName,
      productFullName,
    },
    sender: `${productFullName} <${config.noReplyEmail}>`,
  }, callback);
};
