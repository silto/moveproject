/* @flow */

const DataLoader = require("dataloader");
const mongoose = require("mongoose");

const Trade = mongoose.model("Trade");

/*::
export type TradeSubQueryParams = {
  moveId: string,
  startTime?: Date,
  endTime?: Date,
}
*/

module.exports.createTradesLoader = ()/*: DataLoader<TradeSubQueryParams,Array<Trade>>*/ => {
  const tradesLoader = new DataLoader(
    (queries /*: Array<TradeSubQueryParams>*/) => Promise.all(queries.map(({
      moveId,
      startTime,
      endTime,
    }) => {
      let mongoQuery = {
        move: moveId,
      };
      if ((startTime || endTime)) {
        if (endTime) {
          if (endTime.toString() !== "Invalid Date") {
            mongoQuery.date = {$lt: endTime};
          }
        }
        if (startTime) {
          if (startTime.toString() !== "Invalid Date") {
            if (mongoQuery.date) {
              (mongoQuery.date/*:Object*/).$gte = startTime;
            } else {
              mongoQuery.date = {$gte: startTime};
            }
          }
        }
      }
      return Trade.find(mongoQuery)
      .sort({"timestamp": 1})
      .limit(1000)
      .lean()
      .exec();
    })),
    {cache: true}
  );
  return tradesLoader;
};
