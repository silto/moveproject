/* @flow */

const DataLoader = require("dataloader");
const mongoose = require("mongoose");
const { ApolloError } = require("apollo-server-express");

const Move = mongoose.model("Move");

/*::

export type MonthlyExpirationData = {
  jan: number,
  feb: number,
  mar: number,
  apr: number,
  may: number,
  jun: number,
  jul: number,
  aug: number,
  sep: number,
  oct: number,
  nov: number,
  dec: number,
};

export type MonthlyExpirationParams = {
  normalizedToPosition?: number,
  normalizationTimeframe?: string,
};

*/

const getNormalizedMonthlyExpirationPipeline = (normalizedToPosition, normalizationTimeframe = "1h") => ([
  {
    "$project": {
      "month": {
        "$month": "$openDate",
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
      "month": "$month",
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
      "_id": "$month",
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

const getMonthlyExpirationPipeline = () => ([
  {
    "$project": {
      "month": {
        "$month": "$openDate",
      },
      "_id": "$_id",
      "expirationPrice": "$expirationPrice",
    },
  }, {
    "$group": {
      "_id": "$month",
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

const formatMonthlyData = (monthlyAgg) => {
  let monthlyData = {};
  monthlyAgg.forEach((monthly) => {
    if (monthly._id === 1) {
      monthlyData.jan = monthly.avgExp;
    } else if (monthly._id === 2) {
      monthlyData.feb = monthly.avgExp;
    } else if (monthly._id === 3) {
      monthlyData.mar = monthly.avgExp;
    } else if (monthly._id === 4) {
      monthlyData.apr = monthly.avgExp;
    } else if (monthly._id === 5) {
      monthlyData.may = monthly.avgExp;
    } else if (monthly._id === 6) {
      monthlyData.jun = monthly.avgExp;
    } else if (monthly._id === 7) {
      monthlyData.jul = monthly.avgExp;
    } else if (monthly._id === 8) {
      monthlyData.aug = monthly.avgExp;
    } else if (monthly._id === 9) {
      monthlyData.sep = monthly.avgExp;
    } else if (monthly._id === 10) {
      monthlyData.oct = monthly.avgExp;
    } else if (monthly._id === 11) {
      monthlyData.nov = monthly.avgExp;
    } else if (monthly._id === 12) {
      monthlyData.dec = monthly.avgExp;
    }
  });
  return monthlyData;
};

module.exports.createMonthlyExpirationAvgLoader = ()/*: DataLoader<MonthlyExpirationParams,MonthlyExpirationData>*/ => {
  const moveLoader = new DataLoader(
    (queries /*: Array<MonthlyExpirationParams>*/) => {
      if (queries.every(query => typeof query.normalizedToPosition !== "number")) {
        // all queries want not normalized, only 1 aggregation to do
        return Move.aggregate(getMonthlyExpirationPipeline())
        .exec()
        .then(monthlyAgg => {
          if (!monthlyAgg) {
            return Promise.reject(new ApolloError("error getting monthly expiration data", "UNKNOWN_ERROR"));
          }
          const monthlyData = formatMonthlyData(monthlyAgg);
          return queries.map(() => Object.assign({}, monthlyData));
        });
      } else if (queries.every(query => (
        typeof query.normalizedToPosition === "number" &&
        query.normalizedToPosition === queries[0].normalizedToPosition &&
        query.normalizationTimeframe === queries[0].normalizationTimeframe
      ))) {
        // all queries want the same aggregation, only 1 to do
        return Move.aggregate(getNormalizedMonthlyExpirationPipeline(queries[0].normalizedToPosition, queries[0].normalizationTimeframe))
        .exec()
        .then(monthlyAgg => {
          if (!monthlyAgg) {
            return Promise.reject(new ApolloError("error getting monthly expiration data", "UNKNOWN_ERROR"));
          }
          const monthlyData = formatMonthlyData(monthlyAgg);
          return queries.map(() => Object.assign({}, monthlyData));
        });
      } else {
        // various aggregations, do them all
        return Promise.all(queries.map(query => {
          let aggPipe;
          if (typeof query.normalizedToPosition !== "number") {
            aggPipe = getMonthlyExpirationPipeline();
          } else {
            aggPipe = getNormalizedMonthlyExpirationPipeline(query.normalizedToPosition, query.normalizationTimeframe);
          }
          return Move.aggregate(aggPipe)
          .exec()
          .then(monthlyAgg => {
            if (!monthlyAgg) {
              return Promise.reject(new ApolloError("error getting monthly expiration data", "UNKNOWN_ERROR"));
            }
            return formatMonthlyData(monthlyAgg);
          });
        }));
      }
    },
    {cache: true}
  );

  return moveLoader;
};
