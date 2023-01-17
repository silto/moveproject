/* @flow */
const { gql } = require("apollo-server-express");
const {authenticated} = require("../../middlewares").graphQLAuth;
const { ApolloError } = require("apollo-server-express");
const moment = require("moment");

// const config = require("../../../config");
// # Root Query type

exports.definitions = [
  gql`

type WeeklyExpirationAvg {
  id: ID!
  mon: Float
  tue: Float
  wed: Float
  thu: Float
  fri: Float
  sat: Float
  sun: Float
}

type MonthlyExpirationAvg {
  id: ID!
  jan: Float
  feb: Float
  mar: Float
  apr: Float
  may: Float
  jun: Float
  jul: Float
  aug: Float
  sep: Float
  oct: Float
  nov: Float
  dec: Float
}

type MoveRef {
  id: ID!
  symbol: String!
  # The duration for which the contract stays open
  openDuration: ContractDuration!
  # the date at which the contract opened as a future
  openAsFutureDate: DateTime
  # the date at which the contract opened
  openDate: DateTime!
  # the date at which the contract expired
  closeDate: DateTime
}

type Expiration {
  id: ID!
  symbol: String!
  openDate: DateTime
  expirationPrice: Float
  min: Float
  max: Float
}

type DistributionPoint {
  range: String
  count: Int
}

type ExpirationDistribution {
  id: ID!
  distribution: [DistributionPoint]
}

# The Root type for exploration of the GraphQL schema
type RootQuery {
  # The authenticated user
  me: User
  # a move contract
  move(moveId: String, symbol: String): Move
  # list the available move contracts with id, symbol and dates
  availableMoves: [MoveRef]
  # multiple move contracts, with the possibility to normalize the expiration price to a 1h candle
  moves(startTime: DateTime, endTime: DateTime, normalizedToPosition: Int, normalizationTimeframe: String): [Move]
  # get the average expiration per day of week, normalized or not
  weeklyExpirationAvg(normalizedToPosition: Int, normalizationTimeframe: String): WeeklyExpirationAvg
  # get the average expiration per month, normalized or not
  monthlyExpirationAvg(normalizedToPosition: Int, normalizationTimeframe: String): MonthlyExpirationAvg
  # get teh distribution of expirations by price, normalized or not
  expirationDistribution(normalizedToPosition: Int, normalizationTimeframe: String): ExpirationDistribution
  # get the expiration history, with/without min & max prices, normalized or not
  expirations(normalizedToPosition: Int, normalizationTimeframe: String, minmax: Boolean, minmaxAfterNormCandle: Boolean): [Expiration]
  # the Bitcoin candle history
  btcohlc(timeframe: String, startTime: DateTime, endTime: DateTime): [BTCOHLC]
  # a backtest object
  backtest(backtestId: String!): Backtest
}
`,
];
/*::
import User from "../../shared/models/user"
import type {UserLoaders, AuthenticatedUserLoaders} from "../../dataloaders"
import type { $Request, $Response } from 'express';

export type UserSession = {
  user: User,
  destroy: Function,
  uniq: Function,
}

export type Context = {
  user: User,
  loaders: UserLoaders,
  session: UserSession,
  language: string,
  req : $Request,
  res : $Response,
}

export type AuthenticatedContext = {
  user: User,
  loaders: AuthenticatedUserLoaders,
  session: UserSession,
  language: string,
}

export type RootObject = {}
*/


exports.resolvers = {
  RootQuery: {
    me: authenticated((root/*: RootObject*/, args, {loaders}/*: AuthenticatedContext*/) =>
      loaders.user.load(true)),
    move: (root/*: RootObject*/, {moveId, symbol}/*: {moveId?: string, symbol?: string}*/, {loaders}/*: Context*/) => {
      if (!moveId && !symbol) {
        return Promise.reject(new ApolloError("no moveId nor symbol provided", "BAD_REQUEST"));
      } else if (moveId && symbol) {
        return Promise.reject(new ApolloError("moveId and symbol can't be queried together", "BAD_REQUEST"));
      }
      if (moveId) {
        return loaders.move.load(moveId);
      } else {
        return loaders.moveSymbol.load(symbol);
      }
    },
    availableMoves: (root/*: RootObject*/, _, {loaders}/*: Context*/) =>
      loaders.moveRefs.load(true),
    moves: (root/*: RootObject*/, {
      startTime,
      endTime,
      normalizedToPosition,
      normalizationTimeframe = "1h",
    }/*: OHLCQueryParams*/, {loaders}/*: Context*/) =>
      loaders.movesForDates.load({
        startTime,
        endTime,
      })
      .then((moves) => {
        if (!moves) {
          return null;
        }
        if (moves.length === 0) {
          return moves;
        }
        if (typeof normalizedToPosition !== "number") {
          return moves;
        }
        return loaders.ohlcAtPositionForDates.load({
          timeframe: normalizationTimeframe,
          position: normalizedToPosition,
          startTime,
          endTime,
        })
        .then(normCandles => {
          if (!normCandles) {
            return Promise.reject(new ApolloError("could not normalize, normalization candles not found", "NORMALIZATION_ERROR"));
          }
          const normObj = {};
          normCandles.forEach(candle => normObj[candle.symbol] = candle);
          return moves.map((move) => {
            const normCandle = normObj[move.symbol];
            if (!normCandle) {
              return null;
            }
            return {
              ...move,
              _id: `${move._id.toString()}-npos_${normalizedToPosition}-ntf=${normalizationTimeframe}`,
              expirationPrice: move.expirationPrice/normCandle.open,
            };
          });
        });
      }),
    weeklyExpirationAvg: (root/*: RootObject*/, {
      normalizedToPosition,
      normalizationTimeframe = "1h",
    }/*: {
      normalizedToPosition?: number,
      normalizationTimeframe?: string
    }*/, {loaders}/*: Context*/) =>
      loaders.weeklyExpirationAvg.load({normalizedToPosition, normalizationTimeframe})
      .then(weeklyData => ({
        ...weeklyData,
        id: `weeklyExp-${
          moment.utc().format("DDMMYYYY")
        }${
          typeof normalizedToPosition === "number"? `-npos=${normalizedToPosition}-ntf=${normalizationTimeframe}` : ""
        }`,
      })),
    monthlyExpirationAvg: (root/*: RootObject*/, {
      normalizedToPosition,
      normalizationTimeframe = "1h",
    }/*: {
      normalizedToPosition?: number,
      normalizationTimeframe?: string
    }*/, {loaders}/*: Context*/) =>
      loaders.monthlyExpirationAvg.load({normalizedToPosition, normalizationTimeframe})
      .then(monthlyData => ({
        ...monthlyData,
        id: `monthlyExp-${
          moment.utc().format("DDMMYYYY")
        }${
          typeof normalizedToPosition === "number"? `-npos=${normalizedToPosition}-ntf=${normalizationTimeframe}` : ""
        }`,
      })),
    expirationDistribution: (root/*: RootObject*/, {
      normalizedToPosition,
      normalizationTimeframe = "1h",
    }/*: {
      normalizedToPosition?: number,
      normalizationTimeframe?: string
    }*/, {loaders}/*: Context*/) =>
      loaders.expirationDistribution.load({normalizedToPosition, normalizationTimeframe})
      .then(expirationDistributionData => ({
        id: `distribExp-${
          moment.utc().format("DDMMYYYY")
        }${
          typeof normalizedToPosition === "number"? `-npos=${normalizedToPosition}-ntf=${normalizationTimeframe}` : ""
        }`,
        distribution: expirationDistributionData,
      })),
    expirations: (root/*: RootObject*/, {
      normalizedToPosition,
      normalizationTimeframe = "1h",
      minmax = false,
      minmaxAfterNormCandle = false,
    }/*: {
      normalizedToPosition?: number,
      normalizationTimeframe: string,
      minmax: boolean,
      minmaxAfterNormCandle: boolean,
    }*/, {loaders}/*: Context*/) =>
      (minmax?
        loaders.expirationMinMax.load({normalizedToPosition, normalizationTimeframe, minmaxAfterNormCandle})
        .then(moves => moves.map(move => ({
          ...move,
          id: `${move._id.toString()}-minmax${
            typeof normalizedToPosition === "number"? `-npos=${normalizedToPosition}-ntf=${normalizationTimeframe}` : ""
          }${
            minmaxAfterNormCandle? "-afterNorm" : ""
          }`,
        }))) :
        loaders.expirations.load({normalizedToPosition, normalizationTimeframe})
        .then(moves => moves.map(move => ({
          ...move,
          id: `${move._id.toString()}${
            typeof normalizedToPosition === "number"? `-npos=${normalizedToPosition}-ntf=${normalizationTimeframe}` : ""
          }`,
        })))),
    btcohlc: (root/*: RootObject*/, {
      timeframe = "1h",
      startTime,
      endTime,
    }/*: {
      timeframe: string,
      startTime?: Date,
      endTime?: Date,
    }*/, {loaders}/*: Context*/) =>
      loaders.btcohlc.load({
        timeframe,
        startTime,
        endTime,
      }),
    backtest: (root/*: RootObject*/, {backtestId}/*: {backtestId: string}*/, {loaders}/*: Context*/) => loaders.backtest.load(backtestId),
  },
  MoveRef: {
    id: (moveRef/*: MoveRef*/) => moveRef._id.toString(),
  },
};
