const { gql } = require("apollo-server-express");

// # User Query type

exports.definitions = [
  gql`

# An OHLC with context information
type OHLC {
  # The unique id of the candle object
  id: ID!
  # the timeframe of the candle
  timeframe: String!
  # the date of the candle
  date: DateTime!
  # the unix timestamp of the candle
  timestamp: Int
  # the position of the candle in this contract and timeframe's history
  position: Int
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
import type {Context} from "./RootQuery"
import OHLC from "../../shared/models/ohlc"

*/

exports.resolvers = {
  OHLC: {
    id: (ohlc/*: OHLC*/) => ohlc._id.toString(),
  },
};
