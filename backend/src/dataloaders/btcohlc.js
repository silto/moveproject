/* @flow */

const DataLoader = require("dataloader");
const mongoose = require("mongoose");
// const {OHLC_TIMEFRAMES} = require("../utils/constants");

const BTCOHLC = mongoose.model("BTCOHLC");

/*::
export type BTCOHLCQueryParams = {
  timeframe: string,
  startTime?: Date,
  endTime?: Date,
}
*/

module.exports.createBTCOhlcLoader = ()/*: DataLoader<BTCOHLCQueryParams,Array<OHLC>>*/ => {
  const ohlcLoader = new DataLoader(
    (queries /*: Array<BTCOHLCQueryParams>*/) => Promise.all(queries.map(({
      timeframe,
      startTime,
      endTime,
    }) => {
      let mongoQuery = {
        timeframe,
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
      return BTCOHLC.find(mongoQuery)
      .sort({"timestamp": 1})
      // .limit(OHLC_TIMEFRAMES[timeframe] < 86400? 360 : null)
      .lean()
      .exec();
    })),
    {cache: true}
  );
  return ohlcLoader;
};
