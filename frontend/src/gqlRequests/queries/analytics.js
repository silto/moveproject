/* @flow */
import config from "../../config";
import gql from "graphql-tag";


// _______ List of expirations by date _______

export type Expiration = {
  id: string,
  openDate: string,
  expirationPrice: number,
  min: ?number,
  max: ?number,
};

export const expirationHistoryQueryDocument = gql`
  query expirationHistoryQuery($normalizedToPosition: Int, $minmax: Boolean, $minmaxAfterNormCandle: Boolean) {
    expirations(normalizedToPosition: $normalizedToPosition, minmax: $minmax, minmaxAfterNormCandle: $minmaxAfterNormCandle) {
      id
      openDate
      expirationPrice
      min
      max
    }
  }
`;

// _______ average expiration by day of week _______

export type ExpirationPerDayOfWeek = {
  id: string,
  mon: number,
  tue: number,
  wed: number,
  thu: number,
  fri: number,
  sat: number,
  sun: number,
};

export const expirationPerDayOfWeekQueryDocument = gql`
  query weeklyExpirationAvgQuery($normalizedToPosition: Int) {
    weeklyExpirationAvg(normalizedToPosition:$normalizedToPosition, normalizationTimeframe:"1h"){
      id
      mon
      tue
      wed
      thu
      fri
      sat
      sun
    }
  }
`;

// _______ average expiration by month _______

export type ExpirationPerMonth = {
  id: string,
  jan: number,
  feb: number,
  mar: number,
  apr: number,
  may: number,
  jun: number,
  jul: number,
  aug: number,
  sep: number,
  oct: number,
  nov: number,
  dec: number,
};

export const expirationPerMonthQueryDocument = gql`
  query monthlyExpirationAvgQuery($normalizedToPosition: Int) {
    monthlyExpirationAvg(normalizedToPosition:$normalizedToPosition, normalizationTimeframe:"1h"){
      id
      jan
      feb
      mar
      apr
      may
      jun
      jul
      aug
      sep
      oct
      nov
      dec
    }
  }
`;

// _______ expiration distribution _______

export type ExpirationDistribution = {
  id: string,
  distribution: Array<{
    range: string,
    count: number,
  }>
};

export const expirationDistributionQueryDocument = gql`
  query expirationDistributionQuery($normalizedToPosition: Int) {
    expirationDistribution(normalizedToPosition:$normalizedToPosition, normalizationTimeframe:"1h") {
      id
      distribution {
        range
        count
      }
    }
  }
`;

// _______ List of IVs by date _______

export type IV = {
  id: string,
  openDate: string,
  IVOpen: number,
  IVFuture: number,
};

export const ivHistoryQueryDocument = gql`
  query ivHistoryQuery {
    moves {
      id
      openDate
      IVOpen
      IVFuture
    }
  }
`;

export type BTCOHLCForIV = {
  id: string,
  timestamp: number,
  open: number,
  high: number,
  low: number,
  close: number,
};

export const ivWithBTCHistoryQueryDocument = gql`
  query ivWithBTCHistoryQuery {
    moves {
      id
      openDate
      IVOpen
      IVFuture
    }
    btcohlc(timeframe: "1d", startTime: "${config.firstMOVE.openAsFutureDate}") {
      id
      timestamp
      open
      high
      low
      close
    }
  }
`;

// _______ get a move contract trades _______

export type MoveWithTrades = {
  id: string,
  symbol: string,
  allTradesLoaded: boolean,
  trades: {
    id: string,
    timestamp: number,
    price: number,
    liquidation: boolean,
    side: string,
    size: number,
  }
};

export const moveTradesQueryDocument = gql`
  query moveTradesQuery($moveId: String, $startTime: DateTime) {
    move(moveId: $moveId) {
      id
      symbol
      allTradesLoaded @client
      trades(startTime: $startTime) {
        id
        date
        timestamp
        price
        liquidation
        side
        size
      }
    }
  }
`;

export const moveAllTradesLoadedCustomResolver = (move, _args, { cache }) => {
  if (!move) {
    return false;
  }
  let cachedMove;
  try {
    cachedMove = cache.readQuery({ query: moveTradesQueryDocument, variables: {moveId: move.id} });
  } catch (e) {
    return false;
  }
  return (cachedMove.move && !!cachedMove.move.allTradesLoaded);
};

// _______ get a move contract's trades summary _______


export type MoveWithTradesSummary = {
  id: string,
  tradesSummary: {
    buyCount: number,
    buy: number,
    sellCount: number,
    sell: number,
    liqBuyCount: number,
    liqBuy: number,
    liqSellCount: number,
    liqSell: number,
  },
};

export const moveTradesSummaryQueryDocument = gql`
  query moveTradesSummaryQuery($moveId: String) {
    move(moveId: $moveId) {
      id
      tradesSummary {
        buy
        sell
        liqBuy
        liqSell
        buyCount
        sellCount
        liqBuyCount
        liqSellCount
      }
    }
  }
`;
