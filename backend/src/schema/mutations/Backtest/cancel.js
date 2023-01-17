/* @flow */
const { gql } = require("apollo-server-express");
const mongoose = require("mongoose");
const moment = require("moment");
const Backtest = mongoose.model("Backtest");
const { ApolloError } = require("apollo-server-express");
const sanitize = require("../../../lib/sanitizer");
const config = require("../../../../config");
const { ObjectId } = mongoose.Types;
const { getBacktestQueue } = require("../../../../config/init-queues");

/*::
  import type {Context} from "../../types/RootQuery"
*/

const cancelBacktest = function(
  {
    backtestId,
  }/*: {
    backtestId: string,
  } */
  ,{loaders}/*: Context*/
) {
  return loaders.backtest.load(backtestId)
  .then((backtest) => {
    if (!backtest) {
      return Promise.reject(new ApolloError("backtest doesn't exist", "NOT_FOUND"));
    }
    if (
      backtest.status === "error" ||
      backtest.status === "running" ||
      backtest.status === "finished"
    ) { // can't interrupt backtest that are already running or finished/errored out
      return backtest;
    }
    backtest.status = "canceled";
    return new Promise((resolve, reject) => {
      backtest
      .save((err, backtest) => {
        if (err) {
          if (config.debug) {
            console.error(err);
          }
          return reject(new ApolloError("error saving backtest", "DB_ERROR"));
        }
        resolve(backtest);
      });
    });
  });
};

exports.interface = `
  cancel(
    backtestId: String!
  ): Backtest!
`;

// define types and inputs specific to this mutation
exports.definitions = [

];

exports.resolver = cancelBacktest;
