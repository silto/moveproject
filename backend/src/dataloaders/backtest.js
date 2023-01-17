/* @flow */

const DataLoader = require("dataloader");
const mongoose = require("mongoose");
const {rematchWithMongoIds} = require("./utils");
const { ApolloError } = require("apollo-server-express");

const {
  ObjectId,
} = mongoose.Types;
const Backtest = mongoose.model("Backtest");

module.exports.createBacktestLoader = ()/*: DataLoader<string,Backtest>*/ => {
  const backtestLoader = new DataLoader(
    (backtestIds /*: Array<string>*/) => {
      const backtestIdsClean = backtestIds.filter(str => mongoose.isValidObjectId(str)).map(str => new ObjectId(str));
      return (backtestIdsClean.length > 0?
        Backtest.find({
          _id: {$in: backtestIdsClean},
        })
        .exec() :
        Promise.resolve()
      )
      .then((docs) => {
        if (!docs || (docs && docs.length === 0)) {
          return Promise.reject(new ApolloError("backtest not found", "NOT_FOUND"));
        }
        return docs;
      })
      .then(docs => rematchWithMongoIds(docs, backtestIds));
    },
    {cache: true}
  );
  return backtestLoader;
};
