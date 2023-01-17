const { gql, ApolloError } = require("apollo-server-express");

// # User Query type

exports.definitions = [
  gql`
enum ContractDuration {
  daily
  weekly
  quarterly
}

type TradesSummary {
  buyCount: Int
  buy: Float
  sellCount: Int
  sell: Float
  liqBuyCount: Int
  liqBuy: Float
  liqSellCount: Int
  liqSell: Float
}
# A User
type Move {
  # The unique id of the user
  id: ID!
  # The symbol (ticker)
  symbol: String!
  # The duration for which the contract stays open
  openDuration: ContractDuration!
  # the date at which the contract opened as a future
  openAsFutureDate: DateTime
  # the date at which the contract opened
  openDate: DateTime!
  # the date at which the contract expired
  closeDate: DateTime
  # the price at which the contract expired
  expirationPrice: Float
  # the Implied Volatility at the time the contract opened as a future
  IVFuture: Float
  # the Implied Volatility at the time the contract opened
  IVOpen: Float
  # the candle history for this contract
  ohlc(timeframe: String, startTime: DateTime, endTime: DateTime, normalizedToDate: DateTime, normalizedToPosition: Int): [OHLC]
  # the trades that happened on this contract
  trades(startTime: DateTime, endTime: DateTime): [Trade]
  # a summary of informations about the trades that happened on this contract
  tradesSummary: TradesSummary
}

`,
];
/*::
import type {Context} from "./RootQuery"

export type Move = {
  id: string,
  symbol: string,
  openDuration: string,
  openAsFutureDate?: Date,
  openDate: Date,
  closeDate?: Date,
  expirationPrice?: number,
  IVFuture?: number,
  IVOpen?: number,
};

type OHLCQueryParams = {
timeframe: string,
startTime?: Date,
endTime?: Date,
normalizedToDate?: Date,
normalizedToPosition?: number,
};

*/

exports.resolvers = {
  Move: {
    id: (move/*: Move*/) => move._id.toString(),
    ohlc: (move/*: Move*/, {
      timeframe = "1h",
      startTime,
      endTime,
      normalizedToDate,
      normalizedToPosition,
    }/*: OHLCQueryParams*/, {loaders}/*: Context*/) => {
      if (normalizedToDate && typeof normalizedToPosition === "number") {
        return Promise.reject(new ApolloError("can't ask for a normalization with date and position at the same time", "BAD_REQUEST"));
      }
      const cleanMoveId = move._id && typeof move._id === "string" ? move._id.split("-")[0] : move._id;
      return loaders.ohlc.load({
        moveId: cleanMoveId,
        timeframe,
        startTime,
        endTime,
      })
      .then((ohlcData) => {
        if (!ohlcData) {
          return null;
        }
        if (ohlcData.length === 0) {
          return ohlcData;
        }
        if (!normalizedToDate && typeof normalizedToPosition !== "number") {
          return ohlcData;
        }
        let normalizationCandleProm;
        if (normalizedToDate) {
          let normDateTime = normalizedToDate.getTime();
          if (move.openAsFutureDate && normDateTime < move.openAsFutureDate.getTime()) {
            return Promise.reject(new ApolloError("could not normalize, normalization candle out of range", "NORMALIZATION_ERROR"));
          }
          if (move.closeDate && normDateTime >= move.closeDate.getTime()) {
            return Promise.reject(new ApolloError("could not normalize, normalization candle out of range", "NORMALIZATION_ERROR"));
          }
          if (
            (!startTime || normDateTime >= startTime.getTime()) &&
            (!endTime || normDateTime < endTime.getTime())
          ) {
            let normTimestamp = Math.round(normDateTime/1000);
            let normCandle = ohlcData.find(ohlc => ohlc.timestamp === normTimestamp);
            normalizationCandleProm = Promise.resolve(normCandle);
          } else {
            normalizationCandleProm = loaders.ohlcAtDate.load({
              moveId: cleanMoveId,
              timeframe,
              date: normalizedToDate,
            });
          }
        } else {
          if (
            (!startTime || normalizedToPosition >= ohlcData[0].position) &&
            (!endTime || normalizedToPosition < ohlcData[ohlcData.length - 1].position)
          ) {
            let normCandle = ohlcData.find(ohlc => ohlc.position === normalizedToPosition);
            normalizationCandleProm = Promise.resolve(normCandle);
          } else {
            normalizationCandleProm = loaders.ohlcAtPosition.load({
              moveId: cleanMoveId,
              timeframe,
              position: normalizedToPosition,
            });
          }
        }
        return normalizationCandleProm
        .then(normCandle => {
          if (!normCandle) {
            return Promise.reject(new ApolloError("could not normalize, normalization candle not found", "NORMALIZATION_ERROR"));
          }
          const normPrice = normCandle.open;
          return ohlcData.map(ohlc => ({
            ...ohlc,
            _id: `${ohlc._id.toString()}-ndate_${normCandle.timestamp}`,
            open: ohlc.open/normPrice,
            high: ohlc.high/normPrice,
            low: ohlc.low/normPrice,
            close: ohlc.close/normPrice,
          }));
        });
      });
    },
    trades: (move/*: Move*/, params/*: {startTime?: Date, endTime?: Date}*/, {loaders}/*: Context*/) =>
      loaders.trades.load({
        moveId: move._id && typeof move._id === "string" ? move._id.split("-")[0] : move._id,
        ...params,
      }),
    tradesSummary: (move/*: Move*/, _, {loaders}/*: Context*/) =>
      loaders.tradesSummary.load(
        move._id && typeof move._id === "string" ? move._id.split("-")[0] : move._id.toString(),
      ),
  },
};
