/* @flow */

const DataLoader = require("dataloader");
const mongoose = require("mongoose");
const { ApolloError } = require("apollo-server-express");

const Move = mongoose.model("Move");

/*::

export type ExpirationDistributionData = Array<{
  range: string,
  count: number,
}>;

export type ExpirationDistributionParams = {
  normalizedToPosition?: number,
  normalizationTimeframe?: string,
};

*/

const getMaxNormalizedExpiration = (normalizedToPosition, normalizationTimeframe = "1h") => ([
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
      "_id": null,
      "maxNormExp": {
        "$max": "$normExp",
      },
    },
  },
]);

const getMaxExpiration = () => ([
  {
    "$group": {
      "_id": null,
      "maxExp": {
        "$max": "$expirationPrice",
      },
    },
  },
]);

const getNormalizedExpirationDistribution = (boundaries, normalizedToPosition, normalizationTimeframe = "1h") => ([
  {
    "$project": {
      "_id": "$_id",
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
      "_id": "$_id",
      "normExp": {
        "$divide": [
          "$expirationPrice", {
            "$first": "$normCandle.open",
          },
        ],
      },
    },
  }, {
    "$bucket": {
      "groupBy": "$normExp",
      "boundaries": boundaries,
      "default": "other",
    },
  },
]);

const getExpirationDistribution = (boundaries) => ([
  {
    "$project": {
      "_id": "$_id",
      "expirationPrice": "$expirationPrice",
    },
  }, {
    "$bucket": {
      "groupBy": "$expirationPrice",
      "boundaries": boundaries,
      "default": "other",
    },
  },
]);

const NORMALIZED_RANGE = 0.1;
const NORMALIZED_RANGE_EXTENDED = 0.5;
const NORMALIZED_RANGE_EXTENDED_LIMIT = 5;
const BASIC_RANGE = 10;
const BASIC_RANGE_EXTENDED = 100;
const BASIC_RANGE_EXTENDED_LIMIT = 800;

const createBoundaries = (maxExp, normalized) => {
  const rangeSize = normalized? NORMALIZED_RANGE : BASIC_RANGE;
  const extendedRangeSize = normalized? NORMALIZED_RANGE_EXTENDED : BASIC_RANGE_EXTENDED;
  const rangeLimit = normalized? NORMALIZED_RANGE_EXTENDED_LIMIT : BASIC_RANGE_EXTENDED_LIMIT;
  let boundaries = [0];
  let lastRange = 0;
  let lastLimitedRange = 0;
  let usedRangeSize = rangeSize;
  let extended = false;
  for (let i = 1; lastRange < maxExp; i++) {
    if (extended === false && lastRange >= rangeLimit) {
      extended = true;
      i = 1;
      lastLimitedRange = lastRange;
      usedRangeSize = extendedRangeSize;
    }
    lastRange = lastLimitedRange + usedRangeSize * i;
    boundaries.push(Math.round(lastRange*10)/10);
  }
  return boundaries;
};

const formatDistributionData = (rawData, boundaries) => {
  let formattedData = [];
  let range;
  for (let i = 0; i < boundaries.length - 1; i++) {
    if (i === 0) {
      range = `[0,${boundaries[1]}]`;
    } else {
      range = `]${boundaries[i]},${boundaries[i + 1]}]`;
    }
    let dataForBoundary = rawData.find(dataPoint => dataPoint._id === boundaries[i]);
    formattedData.push({
      range,
      count: dataForBoundary? dataForBoundary.count : 0,
    });
  }
  return formattedData;
};

module.exports.createExpirationDistributionLoader = ()/*: DataLoader<ExpirationDistributionParams,ExpirationDistributionData>*/ => {
  const moveLoader = new DataLoader(
    (queries /*: Array<ExpirationDistributionParams>*/) => {
      if (queries.every(query => typeof query.normalizedToPosition !== "number")) {
        // all queries want not normalized, only 1 aggregation to do
        return Move.aggregate(getMaxExpiration())
        .exec()
        .then(maxExpirationData => {
          if (!maxExpirationData || maxExpirationData.length !== 1) {
            return Promise.reject(new ApolloError("error getting maximum expiration", "UNKNOWN_ERROR"));
          }
          return createBoundaries(maxExpirationData[0].maxExp, false);
        })
        .then(boundaries =>
          Move.aggregate(getExpirationDistribution(boundaries))
          .exec()
          .then(expirationDistribution => {
            if (!expirationDistribution || expirationDistribution.length === 0) {
              return Promise.reject(new ApolloError("error getting expiration distribution", "UNKNOWN_ERROR"));
            }
            const distributionData = formatDistributionData(expirationDistribution, boundaries);
            return queries.map(() => distributionData.slice());
          })
        );
      } else if (queries.every(query => (
        typeof query.normalizedToPosition === "number" &&
        query.normalizedToPosition === queries[0].normalizedToPosition &&
        query.normalizationTimeframe === queries[0].normalizationTimeframe
      ))) {
        // all queries want the same aggregation, only 1 to do
        return Move.aggregate(getMaxNormalizedExpiration(queries[0].normalizedToPosition, queries[0].normalizationTimeframe))
        .exec()
        .then(maxExpirationData => {
          if (!maxExpirationData || maxExpirationData.length !== 1) {
            return Promise.reject(new ApolloError("error getting maximum expiration", "UNKNOWN_ERROR"));
          }
          return createBoundaries(maxExpirationData[0].maxNormExp, true);
        })
        .then(boundaries =>
          Move.aggregate(
            getNormalizedExpirationDistribution(boundaries, queries[0].normalizedToPosition, queries[0].normalizationTimeframe)
          )
          .exec()
          .then(expirationDistribution => {
            if (!expirationDistribution || expirationDistribution.length === 0) {
              return Promise.reject(new ApolloError("error getting expiration distribution", "UNKNOWN_ERROR"));
            }
            const distributionData = formatDistributionData(expirationDistribution, boundaries);
            return queries.map(() => distributionData.slice());
          })
        );
      } else {
        // various aggregations, do them all
        return Promise.all(queries.map(query => {
          let maxAggPipe;
          if (typeof query.normalizedToPosition !== "number") {
            maxAggPipe = getMaxExpiration();
          } else {
            maxAggPipe = getMaxNormalizedExpiration(query.normalizedToPosition, query.normalizationTimeframe);
          }
          return Move.aggregate(maxAggPipe)
          .exec()
          .then(maxExpirationData => {
            if (!maxExpirationData || maxExpirationData.length !== 1) {
              return Promise.reject(new ApolloError("error getting maximum expiration", "UNKNOWN_ERROR"));
            }
            if (typeof query.normalizedToPosition !== "number") {
              return createBoundaries(maxExpirationData[0].maxNormExp, false);
            } else {
              return createBoundaries(maxExpirationData[0].maxNormExp, true);
            }
          })
          .then(boundaries =>
            Move.aggregate(typeof query.normalizedToPosition !== "number"?
              getExpirationDistribution(boundaries) :
              getNormalizedExpirationDistribution(boundaries, query.normalizedToPosition, query.normalizationTimeframe)
            )
            .exec()
            .then(expirationDistribution => {
              if (!expirationDistribution || expirationDistribution.length === 0) {
                return Promise.reject(new ApolloError("error getting expiration distribution", "UNKNOWN_ERROR"));
              }
              return formatDistributionData(expirationDistribution, boundaries);
            })
          );
        }));
      }
    },
    {cache: true}
  );

  return moveLoader;
};
