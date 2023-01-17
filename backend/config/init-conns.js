"use strict";

const mongoose = require("mongoose");
const config = require("./index");

// Connect to MongoDB
module.exports = async () => {
  console.info("Connecting to MongoDB.");
  await mongoose.connect(config.database.uri, {
  });
};
