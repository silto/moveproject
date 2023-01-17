"use strict";

/**
 * Config precedence
 *
 * 1. Environment/dotenv conf
 * 2. NODE_ENV-specific default conf
 * 3. Default conf
 */

const templating = require("./helpers/templating");
const deepExtend = require("./helpers/deep-extend");

// ENVIRONMENT
const nodeEnv = (process.env.NODE_ENV || "development");
const confEnv = process.env.CONF || null;
// CONFIGS
const userConfig = require("./config.js");
const defaultConfig = require("./defaults.js");
let envConfig = {};
try {
  envConfig = require(`./environments/${confEnv || nodeEnv}`);
} catch (e) { /* noop */ }

// MERGE
module.exports = templating.walkAndReplace(deepExtend(deepExtend(defaultConfig, envConfig), userConfig));

module.exports.nodeEnv = nodeEnv;
