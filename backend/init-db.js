"use strict";
/* eslint no-console: 0 */
const mongoose = require("mongoose");
const config = require("./config");
const mailHelpers = require("./src/lib/mail-helpers");
//pre-load all mongoose and connect to mongodb
require("./src/shared/models")(config, { mail: mailHelpers});
const mongooseInit = require("./config/init-conns");
const {makeDbMove} = require("./src/routines");

const terminate = function() {
  mongoose.connection.close(function(){
    process.exit(0);
  });
};
mongooseInit()
.then(() => makeDbMove("daily", Object.assign({}, {
  skipIfAlreadyInDb: true, // check all move contracts
}, config.jobs.moveDaily)))
.then(() => {
  console.log(`all done`);
  setTimeout(() => terminate(), 5000);
}).catch((e) => {
  console.error(e);
  setTimeout(() => terminate(), 5000);
});

