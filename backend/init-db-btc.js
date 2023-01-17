"use strict";
/* eslint no-console: 0 */
const mongoose = require("mongoose");
const config = require("./config");
const mailHelpers = require("./src/lib/mail-helpers");
//pre-load all mongoose and connect to mongodb
require("./src/shared/models")(config, { mail: mailHelpers});
const mongooseInit = require("./config/init-conns");
const {makeDbBTCFromCSV, completeBTCFromAPI} = require("./src/routines");

const terminate = function() {
  mongoose.connection.close(function(){
    process.exit(0);
  });
};

// makeDbBTCFromCSV(config.jobs.btc)
// .then(() => completeBTCFromAPI(config.jobs.btc))
mongooseInit()
.then(() => completeBTCFromAPI(config.jobs.btc))
.then(() => {
  console.log(`all done`);
  setTimeout(() => terminate(), 5000);
}).catch((e) => {
  console.error(e);
  setTimeout(() => terminate(), 5000);
});

