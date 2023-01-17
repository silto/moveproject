/* @flow */

import gql from "graphql-tag";


// _______ List of available MOVE contracts _______

export type MoveRef = {
  id: string,
  symbol: string,
  openDuration: string,
  openAsFutureDate: string,
  openDate: string,
  closeDate: string,
};

export const availableMovesQueryDocument = gql`
  query availableMovesQuery {
    availableMoves {
      id
      symbol
      openDuration
      openAsFutureDate
      openDate
      closeDate
    }
  }
`;

// get a move contract OHLC

export type MoveWithOhlc = {
  id: string,
  symbol: string,
  ohlc: Array<{
    id: string,
    timestamp: number,
    open: number,
    high: number,
    low: number,
    close: number,
    volume: number,
  }>,
};

export const moveOhlcQueryDocument = gql`
  query moveOhlcQuery($moveId: String, $timeframe: String, ) {
    move(moveId: $moveId) {
      id
      symbol
      ohlc(timeframe: $timeframe) {
        id
        timestamp
        open
        high
        low
        close
        volume
      }
    }
  }
`;

export const moveOhlcRangeQueryDocument = gql`
  query moveOhlcRangeQuery($symbol: String, $timeframe: String, $startTime: DateTime, $endTime: DateTime) {
    move(symbol: $symbol) {
      id
      symbol
      ohlc(timeframe: $timeframe, startTime: $startTime, endTime: $endTime) {
        id
        timestamp
        open
        high
        low
        close
        volume
      }
    }
    btcohlc(timeframe: $timeframe, startTime: $startTime, endTime: $endTime) {
      id
      timestamp
      timeframe
      open
      high
      low
      close
      volume
    }
  }
`;

// get BTC OHLC

export type BTCOHLC = {
  id: string,
  timestamp: number,
  open: number,
  high: number,
  low: number,
  close: number,
  volume: number,
};


export const btcOhlcRangeQueryDocument = gql`
  query btcOhlcRangeQuery($timeframe: String, $startTime: DateTime, $endTime: DateTime) {
    btcohlc(timeframe: $timeframe, startTime: $startTime, endTime: $endTime) {
      id
      timestamp
      timeframe
      open
      high
      low
      close
      volume
    }
  }
`;
