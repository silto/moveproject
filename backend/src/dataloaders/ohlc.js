/* @flow */

const DataLoader = require("dataloader");
const mongoose = require("mongoose");
// const {OHLC_TIMEFRAMES} = require("../utils/constants");
// const {rematchWithMongoIds} = require("./utils");
// const { ApolloError } = require("apollo-server-express");

// const {
//   ObjectId,
// } = mongoose.Types;
const OHLC = mongoose.model("OHLC");

/*::
export type OHLCSubQueryParams = {
  moveId: string,
  timeframe: string,
  startTime?: Date,
  endTime?: Date,
}
*/

module.exports.createOhlcLoader = ()/*: DataLoader<OHLCSubQueryParams,Array<OHLC>>*/ => {
  const ohlcLoader = new DataLoader(
    (queries /*: Array<OHLCSubQueryParams>*/) => Promise.all(queries.map(({
      moveId,
      timeframe,
      startTime,
      endTime,
    }) => {
      let mongoQuery = {
        move: moveId,
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
      return OHLC.find(mongoQuery)
      .sort({"timestamp": 1})
      // .limit(OHLC_TIMEFRAMES[timeframe] < 86400? 360 : null)
      .lean()
      .exec();
    })),
    {cache: true}
  );

  return ohlcLoader;
};

/*::
export type OHLCAtDateQueryParams = {
  moveId: string,
  timeframe: string,
  date: Date,
}
*/

module.exports.createOhlcAtDateLoader = ()/*: DataLoader<OHLCAtDateQueryParams,OHLC>*/ => {
  const ohlcLoader = new DataLoader(
    (queries /*: Array<OHLCAtDateQueryParams>*/) => Promise.all(queries.map(({
      moveId,
      timeframe,
      date,
    }) => {
      let mongoQuery = {
        move: moveId,
        timeframe,
        date,
      };
      return OHLC.findOne(mongoQuery)
      .lean()
      .exec();
    })),
    {cache: true}
  );

  return ohlcLoader;
};

/*::
export type OHLCAtPositionQueryParams = {
  moveId: string,
  timeframe: string,
  position: number,
}
*/

module.exports.createOhlcAtPositionLoader = ()/*: DataLoader<OHLCAtPositionQueryParams,OHLC>*/ => {
  const ohlcLoader = new DataLoader(
    (queries /*: Array<OHLCAtDateQueryParams>*/) => Promise.all(queries.map(({
      moveId,
      timeframe,
      position,
    }) => {
      let mongoQuery = {
        move: moveId,
        timeframe,
        position,
      };
      return OHLC.findOne(mongoQuery)
      .lean()
      .exec();
    })),
    {cache: true}
  );

  return ohlcLoader;
};

/*::
export type OHLCAtPositionForDatesQueryParams = {
  timeframe: string,
  position: number,
  startTime?: Date,
  endTime?: Date,
}
*/

module.exports.createOhlcAtPositionForDatesLoader = ()/*: DataLoader<OHLCAtPositionForDatesQueryParams,Array<OHLC>>*/ => {
  const ohlcLoader = new DataLoader(
    (queries /*: Array<OHLCAtPositionForDatesQueryParams>*/) => Promise.all(queries.map(({
      timeframe,
      position,
      startTime,
      endTime,
    }) => {
      let mongoQuery = {
        timeframe,
        position,
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
      return OHLC.find(mongoQuery)
      .lean()
      .sort({"timestamp": 1})
      .exec();
    })),
    {cache: true}
  );

  return ohlcLoader;
};
