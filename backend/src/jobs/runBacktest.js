"use strict";

const config = require("../../config");
const mailHelpers = require("../lib/mail-helpers");
//pre-load all mongoose and connect to mongodb
require("../shared/models")(config, { mail: mailHelpers});
const mongooseInit = require("../../config/init-conns");
let mongooseInitialized = false;

const {backtest} = require("../routines");

module.exports = async (job) => {
  if (!mongooseInitialized) {
    mongooseInitialized = await mongooseInit();
  }
  console.info(`starting backtest job`);
  const {data} = job;
  return backtest(Object.assign({}, data));
};
