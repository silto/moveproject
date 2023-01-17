const { gql } = require("apollo-server-express");

// # User Query type

exports.definitions = [
  gql`

# A trade on a move contract
type Trade {
  # The unique id of the Trade
  id: ID!
  # the date of the trade
  date: DateTime!
  # the unix timestamp of the trade
  timestamp: Int
  # true if this trade was a liquidation
  liquidation: Boolean
  # the price at which the trade occured
  price: Float
  # the side (buy or sell) of the trade
  side: String
  # the size of the trade in MOVE contracts
  size: Float
}

`,
];
/*::
import type {Context} from "./RootQuery"
import Trade from "../../shared/models/trade"

*/

exports.resolvers = {
  Trade: {
    id: (ohlc/*: OHLC*/) => ohlc._id.toString(),
  },
};
