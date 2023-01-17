/* @flow */

const DataLoader = require("dataloader");
const mongoose = require("mongoose");
const { ApolloError } = require("apollo-server-express");

const Move = mongoose.model("Move");

const getNormalizedExpirationMinMaxPipeline = (normalizedToPosition, normalizationTimeframe = "1h", minmaxAfterNormCandle) => ([
  /*{
    "$match": {
      "openDate": {
        "$gte": Date("Tue, 01 Sep 2020 00:00:00 GMT")
      }
    }
  }, */{
    "$lookup": {
      "from": "ohlcs",
      "let": {
        "moveId": "$_id",
        "timeframe": "1h",
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
                    "$timeframe", "$$timeframe",
                  ],
                },
                {
                  $gte: [
                    "$position", minmaxAfterNormCandle? normalizedToPosition : 0,
                  ],
                },
              ],
            },
          },
        },
      ],
      "as": "candles",
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
      "_id": "$_id",
      "symbol": "$symbol",
      "openDate": "$openDate",
      "expirationPrice": {
        "$divide": [
          "$expirationPrice", {
            "$first": "$normCandle.open",
          },
        ],
      },
      "max": {
        "$divide": [
          {
            "$max": "$candles.high",
          }, {
            "$first": "$normCandle.open",
          },
        ],
      },
      "min": {
        "$divide": [
          {
            "$min": "$candles.low",
          }, {
            "$first": "$normCandle.open",
          },
        ],
      },
    },
  }, {
    "$sort": {
      "openDate": 1,
    },
  },
]);

const getExpirationMinMaxPipeline = () => ([
  {
    "$lookup": {
      "from": "ohlcs",
      "let": {
        "moveId": "$_id",
        "timeframe": "1h",
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
                    "$timeframe", "$$timeframe",
                  ],
                },
              ],
            },
          },
        },
      ],
      "as": "candles",
    },
  }, {
    "$project": {
      "_id": "$_id",
      "symbol": "$symbol",
      "openDate": "$openDate",
      "expirationPrice": "$expirationPrice",
      "max": {
        "$max": "$candles.high",
      },
      "min": {
        "$min": "$candles.low",
      },
    },
  }, {
    "$sort": {
      "openDate": 1,
    },
  },
]);

/*::

export type ExpirationMinMaxParams = {
  normalizedToPosition?: number,
  normalizationTimeframe?: string,
  minmaxAfterNormCandle?: boolean,
};

export type ExpirationMinMaxData = {
  _id: Object,
  symbol: string,
  openDate: string,
  expirationPrice: number,
  min: number,
  max: number,
};

*/

module.exports.createExpirationsMinMaxLoader = ()/*: DataLoader<ExpirationMinMaxParams,Array<ExpirationMinMaxData>>*/ => {
  const expMinMaxLoader = new DataLoader(
    (queries /*: Array<ExpirationMinMaxParams>*/) => {
      if (queries.every(query => typeof query.normalizedToPosition !== "number")) {
        // all queries want not normalized, only 1 aggregation to do
        return Move.aggregate(getExpirationMinMaxPipeline())
        .exec()
        .then(moves => {
          if (!moves) {
            return Promise.reject(new ApolloError("error getting expiration+min+max data", "UNKNOWN_ERROR"));
          }
          return queries.map(() => moves);
        });
      } else if (queries.every(query => (
        typeof query.normalizedToPosition === "number" &&
        query.normalizedToPosition === queries[0].normalizedToPosition &&
        query.normalizationTimeframe === queries[0].normalizationTimeframe &&
        query.minmaxAfterNormCandle === queries[0].minmaxAfterNormCandle
      ))) {
        // all queries want the same aggregation, only 1 to do
        return Move.aggregate(
          getNormalizedExpirationMinMaxPipeline(
            queries[0].normalizedToPosition,
            queries[0].normalizationTimeframe,
            queries[0].minmaxAfterNormCandle
          )
        )
        .exec()
        .then(moves => {
          if (!moves) {
            return Promise.reject(new ApolloError("error getting expiration+min+max data", "UNKNOWN_ERROR"));
          }
          return queries.map(() => moves);
        });
      } else {
        // various aggregations, do them all
        return Promise.all(queries.map(query => {
          let aggPipe;
          if (typeof query.normalizedToPosition !== "number") {
            aggPipe = getExpirationMinMaxPipeline();
          } else {
            aggPipe = getNormalizedExpirationMinMaxPipeline(
              query.normalizedToPosition,
              query.normalizationTimeframe,
              query.minmaxAfterNormCandle
            );
          }
          return Move.aggregate(aggPipe)
          .exec()
          .then(moves => {
            if (!moves) {
              return Promise.reject(new ApolloError("error getting expiration+min+max data", "UNKNOWN_ERROR"));
            }
            return moves;
          });
        }));
      }
    },
    {cache: true}
  );

  return expMinMaxLoader;
};

const getNormalizedExpirationPipeline = (normalizedToPosition, normalizationTimeframe = "1h") => ([
  {
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
      "_id": "$_id",
      "symbol": "$symbol",
      "openDate": "$openDate",
      "expirationPrice": {
        "$divide": [
          "$expirationPrice", {
            "$first": "$normCandle.open",
          },
        ],
      },
    },
  }, {
    "$sort": {
      "openDate": 1,
    },
  },
]);

/*::

export type ExpirationParams = {
  normalizedToPosition?: number,
  normalizationTimeframe?: string,
};

export type ExpirationData = {
  _id: Object,
  symbol: string,
  openDate: string,
  expirationPrice: number,
};

*/

module.exports.createExpirationsLoader = ()/*: DataLoader<ExpirationParams,Array<ExpirationData>>*/ => {
  const expLoader = new DataLoader(
    (queries /*: Array<ExpirationParams>*/) => {
      if (queries.every(query => typeof query.normalizedToPosition !== "number")) {
        // all queries want not normalized, only 1 aggregation to do
        return Move.find({})
        .sort({"openDate": 1})
        .lean()
        .exec()
        .then((moves => {
          if (!moves) {
            return Promise.reject(new ApolloError("error getting expiration data", "UNKNOWN_ERROR"));
          }
          return queries.map(() => moves);
        }));
      } else if (queries.every(query => (
        typeof query.normalizedToPosition === "number" &&
        query.normalizedToPosition === queries[0].normalizedToPosition &&
        query.normalizationTimeframe === queries[0].normalizationTimeframe
      ))) {
        // all queries want the same aggregation, only 1 to do
        return Move.aggregate(getNormalizedExpirationPipeline(queries[0].normalizedToPosition, queries[0].normalizationTimeframe))
        .exec()
        .then((moves => {
          if (!moves) {
            return Promise.reject(new ApolloError("error getting expiration data", "UNKNOWN_ERROR"));
          }
          return queries.map(() => moves);
        }));
      } else {
        // various aggregations, do them all
        return Promise.all(queries.map(query => {
          let mongoQuery;
          if (typeof query.normalizedToPosition !== "number") {
            mongoQuery = Move.find({})
            .select("symbol openDate expirationPrice")
            .sort({"openDate": 1})
            .lean();
          } else {
            mongoQuery = Move.aggregate(getNormalizedExpirationPipeline(query.normalizedToPosition, query.normalizationTimeframe));
          }
          return mongoQuery
          .exec()
          .then((moves => {
            if (!moves) {
              return Promise.reject(new ApolloError("error getting expiration+min+max data", "UNKNOWN_ERROR"));
            }
            return moves;
          }));
        }));
      }
    },
    {cache: true}
  );

  return expLoader;
};
