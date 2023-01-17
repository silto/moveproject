/* @flow */

import gql from "graphql-tag";

//START

export const startBacktestMutationDocument = gql`
  mutation StartBacktest(
    $startTime: DateTime
    $endTime: DateTime
    $side: PositionSide!
    $openCandle: Int
    $positionSize: Float!
    $takeProfit: Float
    $stopLoss: Float
    $takerFee: Float
    $makerFee: Float
    $slippage: Float
    $daysOfWeek: DaysOfWeekBacktestInput
  ) {
    backtest {
      start(
        startTime: $startTime,
        endTime: $endTime,
        side: $side,
        openCandle: $openCandle,
        positionSize: $positionSize,
        takeProfit: $takeProfit,
        stopLoss: $stopLoss,
        takerFee: $takerFee,
        makerFee: $makerFee,
        slippage: $slippage,
        daysOfWeek: $daysOfWeek
      ){
        id
      }
    }
  }
`;

export const startBacktestMutation = (
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
) => ({
  mutation: startBacktestMutationDocument,
  variables: {
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
  },
});

//CANCEL

export const cancelBacktestMutationDocument = gql`
  mutation StartBacktest(
    $backtestId: String!
  ) {
    backtest {
      cancel(
        backtestId: $backtestId
      ){
        id
        status
      }
    }
  }
`;

export const cancelBacktestMutation = (
  backtestId: string,
) => ({
  mutation: cancelBacktestMutationDocument,
  variables: {
    backtestId,
  },
});
