/* @flow */

const DataLoader = require("dataloader");
const mongoose = require("mongoose");
const { ApolloError } = require("apollo-server-express");

const Move = mongoose.model("Move");

/*::

export type WeeklyExpirationData = {
  mon: number,
  tue: number,
  wed: number,
  thu: number,
  fri: number,
  sat: number,
  sun: number,
};

export type WeeklyExpirationParams = {
  normalizedToPosition?: number,
  normalizationTimeframe?: string,
};

*/

const getNormalizedWeeklyExpirationPipeline = (normalizedToPosition, normalizationTimeframe = "1h") => ([
  {
    "$project": {
      "dayOfWeek": {
        "$dayOfWeek": "$openDate",
      },
      "_id": "$_id",
      "symbol": "$symbol",
      "expirationPrice": "$expirationPrice",
    },
  }, {
    "$lookup": {
      "from": "ohlcs",
      "let": {
        "moveId": "$_id",
        "position": normalizedToPosition,
        "timeframe": normalizationTimeframe,
      },
      "pipeline": [
        {
          "$match": {
            "$expr": {
              "$and": [
                {
                  "$eq": [
                    "$move", "$$moveId",
                  ],
                }, {
                  "$eq": [
                    "$position", "$$position",
                  ],
                }, {
                  "$eq": [
                    "$timeframe", "$$timeframe",
                  ],
                },
              ],
            },
          },
        },
      ],
      "as": "normCandle",
    },
  }, {
    "$project": {
      "dayOfWeek": "$dayOfWeek",
      "_id": "$_id",
      "symbol": "$symbol",
      "normExp": {
        "$divide": [
          "$expirationPrice", {
            "$first": "$normCandle.open",
          },
        ],
      },
    },
  }, {
    "$group": {
      "_id": "$dayOfWeek",
      "avgExp": {
        "$avg": "$normExp",
      },
    },
  },/* {
    "$sort": {
      "_id": 1,
    },
  },*/
]);

const getWeeklyExpirationPipeline = () => ([
  {
    "$project": {
      "dayOfWeek": {
        "$dayOfWeek": "$openDate",
      },
      "_id": "$_id",
      "expirationPrice": "$expirationPrice",
    },
  }, {
    "$group": {
      "_id": "$dayOfWeek",
      "avgExp": {
        "$avg": "$expirationPrice",
      },
    },
  },/* {
    "$sort": {
      "_id": 1,
    },
  },*/
]);

const formatWeeklyData = (weeklyAgg) => {
  let weeklyData = {};
  weeklyAgg.forEach((daily) => {
    if (daily._id === 1) {
      weeklyData.sun = daily.avgExp;
    } else if (daily._id === 2) {
      weeklyData.mon = daily.avgExp;
    } else if (daily._id === 3) {
      weeklyData.tue = daily.avgExp;
    } else if (daily._id === 4) {
      weeklyData.wed = daily.avgExp;
    } else if (daily._id === 5) {
      weeklyData.thu = daily.avgExp;
    } else if (daily._id === 6) {
      weeklyData.fri = daily.avgExp;
    } else if (daily._id === 7) {
      weeklyData.sat = daily.avgExp;
    }
  });
  return weeklyData;
};

module.exports.createWeeklyExpirationAvgLoader = ()/*: DataLoader<WeeklyExpirationParams,WeeklyExpirationData>*/ => {
  const moveLoader = new DataLoader(
    (queries /*: Array<WeeklyExpirationParams>*/) => {
      if (queries.every(query => typeof query.normalizedToPosition !== "number")) {
        // all queries want not normalized, only 1 aggregation to do
        return Move.aggregate(getWeeklyExpirationPipeline())
        .exec()
        .then(weeklyAgg => {
          if (!weeklyAgg) {
            return Promise.reject(new ApolloError("error getting weekly expiration data", "UNKNOWN_ERROR"));
          }
          const weeklyData = formatWeeklyData(weeklyAgg);
          return queries.map(() => Object.assign({}, weeklyData));
        });
      } else if (queries.every(query => (
        typeof query.normalizedToPosition === "number" &&
        query.normalizedToPosition === queries[0].normalizedToPosition &&
        query.normalizationTimeframe === queries[0].normalizationTimeframe
      ))) {
        // all queries want the same aggregation, only 1 to do
        return Move.aggregate(getNormalizedWeeklyExpirationPipeline(queries[0].normalizedToPosition, queries[0].normalizationTimeframe))
        .exec()
        .then(weeklyAgg => {
          if (!weeklyAgg) {
            return Promise.reject(new ApolloError("error getting weekly expiration data", "UNKNOWN_ERROR"));
          }
          const weeklyData = formatWeeklyData(weeklyAgg);
          return queries.map(() => Object.assign({}, weeklyData));
        });
      } else {
        // various aggregations, do them all
        return Promise.all(queries.map(query => {
          let aggPipe;
          if (typeof query.normalizedToPosition !== "number") {
            aggPipe = getWeeklyExpirationPipeline();
          } else {
            aggPipe = getNormalizedWeeklyExpirationPipeline(query.normalizedToPosition, query.normalizationTimeframe);
          }
          return Move.aggregate(aggPipe)
          .exec()
          .then(weeklyAgg => {
            if (!weeklyAgg) {
              return Promise.reject(new ApolloError("error getting weekly expiration data", "UNKNOWN_ERROR"));
            }
            return formatWeeklyData(weeklyAgg);
          });
        }));
      }
    },
    {cache: true}
  );

  return moveLoader;
};
