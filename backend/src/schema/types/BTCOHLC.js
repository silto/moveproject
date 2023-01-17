const { gql } = require("apollo-server-express");

// # User Query type

exports.definitions = [
  gql`

# An OHLC with context information
type BTCOHLC {
  # The unique id of the candle object
  id: ID!
  # the timeframe of the candle
  timeframe: String!
  # the date of the candle
  date: DateTime!
  # the unix timestamp of the candle
  timestamp: Int
  # OHLC prices
  open: Float
  high: Float
  low: Float
  close: Float
  # volume of exchanges during this candle
  volume: Float
}

`,
];
/*::
import BTCOHLC from "../../shared/models/btcohlc"
*/

exports.resolvers = {
  BTCOHLC: {
    id: (btcohlc/*: BTCOHLC*/) => btcohlc._id.toString(),
  },
};
