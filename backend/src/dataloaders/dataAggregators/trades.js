/* @flow */

const DataLoader = require("dataloader");
const mongoose = require("mongoose");
const { ApolloError } = require("apollo-server-express");

const {
  ObjectId,
} = mongoose.Types;

const Trade = mongoose.model("Trade");

/*::
export type TradesSummary = {
  buyCount: number,
  buy: number,
  sellCount: number,
  sell: number,
  liqBuyCount: number,
  liqBuy: number,
  liqSellCount: number,
  liqSell: number,
}
*/

const tradesSummaryPipeline = (moveId) => ([
  {
    "$match": {
      "move": new ObjectId(moveId),
    },
  }, {
    "$facet": {
      "buys": [
        {
          "$match": {
            "side": "buy",
          },
        },
      ],
      "sells": [
        {
          "$match": {
            "side": "sell",
          },
        },
      ],
      "liqBuys": [
        {
          "$match": {
            "side": "buy",
            "liquidation": true,
          },
        },
      ],
      "liqSells": [
        {
          "$match": {
            "side": "sell",
            "liquidation": true,
          },
        },
      ],
    },
  }, {
    "$project": {
      "buyCount": {
        "$size": "$buys",
      },
      "buy": {
        "$sum": "$buys.size",
      },
      "sellCount": {
        "$size": "$sells",
      },
      "sell": {
        "$sum": "$sells.size",
      },
      "liqBuyCount": {
        "$size": "$liqBuys",
      },
      "liqBuy": {
        "$sum": "$liqBuys.size",
      },
      "liqSellCount": {
        "$size": "$liqSells",
      },
      "liqSell": {
        "$sum": "$liqSells.size",
      },
    },
  },
]);

module.exports.createTradesSummaryLoader = ()/*: DataLoader<String,TradesSummary>*/ => {
  const tradesSummaryLoader = new DataLoader(
    (moveIds /*: Array<String>*/) => {
      let moveIdsDifferent = {};
      moveIds.filter(str => mongoose.isValidObjectId(str)).forEach(moveId => moveIdsDifferent[moveId] = null);
      return Promise.all(Object.keys(moveIdsDifferent).map(moveId =>
        Trade.aggregate(tradesSummaryPipeline(moveId)).exec()
        .then(tradesSummary => {
          moveIdsDifferent[moveId] = tradesSummary && tradesSummary[0];
          return true;
        })
      ))
      .then(() => moveIds.map(moveId => moveIdsDifferent[moveId]));
    },
    {cache: true}
  );

  return tradesSummaryLoader;
};
