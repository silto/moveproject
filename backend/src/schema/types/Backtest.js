const { gql } = require("apollo-server-express");

// # User Query type

exports.definitions = [
  gql`

enum BacktestStatus {
  inqueue
  running
  finished
  error
  canceled
}

enum PositionSide {
  long
  short
}

type DaysOfWeekBacktest {
  mon: Boolean
  tue: Boolean
  wed: Boolean
  thu: Boolean
  fri: Boolean
  sat: Boolean
  sun: Boolean
}

type BacktestParameters {
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
  daysOfWeek: DaysOfWeekBacktest
}

type equityDataPoint {
  date: DateTime
  equity: Float
}

type BacktestResults {
  trades: Int
  wins: Int
  losses: Int
  startAccount: Float
  endAccount: Float
  maxEquity: Float
  minEquity: Float
  maxDrawDown: Float
  liquidated: Boolean
  equityHistory: [equityDataPoint]
}

# A backtest informations
type Backtest {
  # The unique id of the backtest
  id: ID!
  parameters: BacktestParameters
  results: BacktestResults
  startRunTime: DateTime
  endRunTime: DateTime
  status: BacktestStatus
}

`,
];
/*::
import Backtest from "../../shared/models/backtest"
*/

exports.resolvers = {
  Backtest: {
    id: (backtest/*: Backtest*/) => backtest._id.toString(),
  },
  BacktestParameters: {
    daysOfWeek: (parameters) => {
      if (!parameters.daysOfWeek || (parameters.daysOfWeek.$isEmpty && parameters.daysOfWeek.$isEmpty())) {
        return null;
      }
      return parameters.daysOfWeek;
    }
  }
};
