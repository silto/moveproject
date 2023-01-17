/* @flow */
const mongoose = require("mongoose");
const moment = require("moment");
const Backtest = mongoose.model("Backtest");
const { gql, ApolloError } = require("apollo-server-express");
const rateLimit = require("../../../lib/rateLimit");
const { getIpFromRequest } = require("../../../utils/serverUtils");
const config = require("../../../../config");
const { getBacktestQueue } = require("../../../../config/init-queues");

/*::
  import type {Context} from "../../types/RootQuery"
*/

const backtestLimiterByIp = rateLimit.backtestLimiterByIp();

const rateLimitErrorWording = `You have reached the rate limit (50 backtests per 24h).${""
} This is a free service, please don't abuse it.${""
} If you want to make more requests contact @_silto_ on twitter or send an email to silto@protonmail.com ;)`

const startBacktest = function(
  {
    startTime,
    endTime,
    side,
    openCandle,
    positionSize,
    takeProfit,
    stopLoss,
    takerFee,
    makerFee,
    slippage,
    daysOfWeek,
  }/*: {
    startTime?: Date,
    endTime?: Date,
    side: string,
    openCandle?: number,
    positionSize: number,
    takeProfit?: number,
    stopLoss?: number,
    takerFee?: number,
    makerFee?: number,
    slippage?: number,
    daysOfWeek?: {
      mon: boolean,
      tue: boolean,
      wed: boolean,
      thu: boolean,
      fri: boolean,
      sat: boolean,
      sun: boolean,
    },
  } */
  ,{req}/*: Context*/
) {
  const ipAddr = getIpFromRequest(req);
  return backtestLimiterByIp.get(ipAddr)
  .then(resRLByIP => {
    let retrySecs = 0;
    // Check if IP is already blocked
    if (resRLByIP !== null && resRLByIP.consumedPoints > config.rateLimits.backtest.ip.points) {
      retrySecs = Math.round(resRLByIP.msBeforeNext / 1000) || 1;
    }
    if (retrySecs > 0) {
      return Promise.reject(new ApolloError(rateLimitErrorWording, "TOO_MANY_REQUESTS"));
    }
    return backtestLimiterByIp.consume(ipAddr)
    .catch(() => Promise.reject(new ApolloError(rateLimitErrorWording, "TOO_MANY_REQUESTS")));
  })
  .then(() => {
    // verify the parameter
    if (startTime && endTime && moment(startTime).isAfter(moment(endTime))) {
      return new ApolloError("startTime is after endTime", "INVALID_INPUTS-STARTTIME");
    }
    if (typeof openCandle === "number" && (openCandle < 0 || openCandle > 47)) {
      return new ApolloError("open candle out of bounds", "INVALID_INPUTS-OPENCANDLE");
    }
    if (positionSize < 0) {
      return new ApolloError("position size can not be negative", "INVALID_INPUTS-POSITIONSIZE");
    }
    if (typeof stopLoss === "number") {
      if (stopLoss <= 0) {
        return new ApolloError("can't have stop loss under 0%", "INVALID_INPUTS-STOPLOSS");
      }
      if (side === "long" && (100 - stopLoss) <= 0) {
        return new ApolloError("stop loss is in negative territory", "INVALID_INPUTS-STOPLOSS");
      }
    }
    if (typeof takeProfit === "number") {
      if (takeProfit <= 0) {
        return new ApolloError("can't have TP under 0%", "INVALID_INPUTS-TAKEPROFIT");
      }
      if (side === "short" && (100 - takeProfit) <= 0) {
        return new ApolloError("take profit is in negative teritory", "INVALID_INPUTS-TAKEPROFIT");
      }
    }
    if (typeof slippage === "number" && (slippage < 0 || slippage > 100)) {
      return new ApolloError("invalid slippage value", "INVALID_INPUTS-SLIPPAGE");
    }
    if (typeof makerFee === "number" && makerFee > 1) {
      return new ApolloError("invalid fee value", "INVALID_INPUTS-FEE");
    }
    if (typeof takerFee === "number" && takerFee > 1) {
      return new ApolloError("invalid fee value", "INVALID_INPUTS-FEE");
    }
    let params = {
      startTime,
      endTime,
      side,
      openCandle,
      positionSize,
      takeProfit,
      stopLoss,
      takerFee,
      makerFee,
      slippage,
      daysOfWeek,
    };
    const backtestQueue = getBacktestQueue();
    return new Promise((resolve, reject) => {
      new Backtest({
        parameters: params,
        status: "inqueue",
      })
      .save((err, backtest) => {
        if (err) {
          if (config.debug) {
            console.error(err);
          }
          return reject(new ApolloError("error saving backtest", "DB_ERROR"));
        }
        backtestQueue.add({
          backtestId: backtest._id.toString(),
        }, {
          attempts: 1,
        });
        resolve(backtest);
      });
    });
  });
};

exports.interface = `
  start(
    startTime: DateTime
    endTime: DateTime
    side: PositionSide!
    openCandle: Int
    positionSize: Float!
    takeProfit: Float
    stopLoss: Float
    takerFee: Float
    makerFee: Float
    slippage: Float
    daysOfWeek: DaysOfWeekBacktestInput
  ): Backtest!
`;

// define types and inputs specific to this mutation
exports.definitions = [
  gql`
  input DaysOfWeekBacktestInput {
    mon: Boolean!
    tue: Boolean!
    wed: Boolean!
    thu: Boolean!
    fri: Boolean!
    sat: Boolean!
    sun: Boolean!
  }
  `,
];

exports.resolver = startBacktest;
