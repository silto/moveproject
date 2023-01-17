/* @flow */
import gql from "graphql-tag";

// _______ average expiration by day of week _______

export type BacktestObject = {
  id: string,
  parameters: {
    startTime: ?string,
    endTime: ?string,
    side: string,
    openCandle: ?number,
    positionSize: number,
    takeProfit: ?number,
    stopLoss: ?number,
    takerFee: ?number,
    makerFee: ?number,
    slippage: ?number,
    daysOfWeek: ?{
      mon: boolean,
      tue: boolean,
      wed: boolean,
      thu: boolean,
      fri: boolean,
      sat: boolean,
      sun: boolean,
    }
  },
  results?: {
    trades: ?number,
    wins: ?number,
    losses: ?number,
    startAccount: ?number,
    endAccount: ?number,
    maxEquity: ?number,
    minEquity: ?number,
    maxDrawDown: ?number,
    liquidated: ?boolean,
    equityHistory?: Array<{
      date: string,
      equity: number,
    }>
  },
  status: string,
};

export const backtestQueryDocument = gql`
  query Backtest($backtestId: String!) {
    backtest(backtestId: $backtestId){
      id
      parameters {
        startTime
        endTime
        side
        openCandle
        positionSize
        takeProfit
        stopLoss
        takerFee
        makerFee
        slippage
        daysOfWeek {
          mon
          tue
          wed
          thu
          fri
          sat
          sun
        }
      }
      results {
        trades
        wins
        losses
        startAccount
        endAccount
        maxEquity
        minEquity
        maxDrawDown
        liquidated
        equityHistory {
          date
          equity
        }
      }
      status
    }
  }
`;

export function createBacktestQuery(backtestId: string) {
  return {
    query: backtestQueryDocument,
    variables: {
      backtestId,
    },
  };
}
