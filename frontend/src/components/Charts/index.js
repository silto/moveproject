/* @flow */
/* eslint-disable camelcase */

import React, { Component } from "react";
import { connect } from "react-redux";
import { compose } from "redux";
import { graphql } from "react-apollo";
import apolloClient from "../../client";
import styled from "styled-components";
import moment from "moment";
import { withTranslation } from "react-i18next";
import type { TFunction } from "react-i18next";
import config from "../../config";
import {
  availableMovesQueryDocument,
  moveOhlcRangeQueryDocument,
  btcOhlcRangeQueryDocument,
} from "../../gqlRequests/queries";
import Container from "../Container";
import ChartZone from "../Container/ChartZone";
import Title from "../Title";
import Loader from "../Loader";
import TradingViewChart from "../Graphs/TradingViewChart";
import { trackEvent } from "../../analytics";
import {HCtoTV, TVtoHC} from "../../lib/timeframeConvert";

import type { MoveWithOhlc, BTCOHLC } from "../../gqlRequests/queries";

const ChartFeed = styled.div`
  position: relative;
  padding-top: 56px;
`;

type ChartsProps = {
  t: TFunction,
  availableMovesData: {
    availableMoves?: Array<{
      id: string,
      symbol: string,
    }>,
    loading: boolean,
  }
};

type ChartsState = {
  datafeed?: {
    onReady: Function,
    searchSymbols: Function,
    resolveSymbol: Function,
    getBars: Function,
    calculateHistoryDepth?: Function,
  }
};

class Charts extends Component<
  ChartsProps,
  ChartsState
> {
  props: ChartsProps;
  state: ChartsState;
  _lastMoveRequested: ?string;
  constructor(props: ChartsProps) {
    super(props);
    this.state = {
      datafeed: null,
    };
  }

  componentDidMount() {
    const { availableMovesData } = this.props;
    if (availableMovesData && availableMovesData.availableMoves) {
      this._generateDatafeed();
    }
  }

  componentDidUpdate(prevProps) {
    const { availableMovesData } = this.props;
    const { availableMovesData: prevAvailableMovesData } = prevProps;
    if (
      availableMovesData && availableMovesData.availableMoves &&
      (!prevAvailableMovesData || !prevAvailableMovesData.availableMoves)
    ) {
      this._generateDatafeed();
    }
  }

  render() {
    const { t, availableMovesData } = this.props;
    const { datafeed } = this.state;
    const availableMoves = availableMovesData && !availableMovesData.loading && availableMovesData.availableMoves;
    const tmpMoveSymbol = availableMoves && availableMoves[0].symbol;
    return <ChartFeed>
      <Container>
        <ChartZone>
          <Title>{t("charts.title")}</Title>
          {tmpMoveSymbol && datafeed? <div>
            <TradingViewChart
              containerId="move_chart_container"
              symbol={tmpMoveSymbol}
              datafeed={datafeed}
              interval={HCtoTV(config.defaultTimeframes.moveDaily)}
              timeframe={config.defaultDisplayedTimeframe.moveDaily}
            />
          </div> : <Loader/>}
        </ChartZone>
      </Container>
    </ChartFeed>;
  }

  _generateDatafeed: Function = () => {
    const { availableMovesData } = this.props;
    const availableMultipliers = config.availableTimeframes.moveDaily.split(",").map((HCtf) => HCtoTV(HCtf));
    const supportedRes = config.choicesTimeframes.moveDaily.split(",").map((HCtf) => HCtoTV(HCtf));
    const availableBTCMultipliers = config.availableTimeframes.btc.split(",").map((HCtf) => HCtoTV(HCtf));
    const supportedBTCRes = config.choicesTimeframes.btc.split(",").map((HCtf) => HCtoTV(HCtf));
    const onReady = (callback) => {
      setTimeout(() => callback({
        exchanges: [],
        symbols_types: [],
        supported_resolutions: supportedRes,
        currency_codes: ["USD"],
        supports_marks: false,
        supports_timescale_marks: false,
        supports_time: false,
      }),0);
    };

    const symbolInfosFromSymbol = (symbol) => {
      const moveForSymbol = availableMovesData && availableMovesData.availableMoves &&
        availableMovesData.availableMoves.find(move => move.symbol === symbol);
      return {
        symbol,
        name: symbol,
        full_name: symbol, // e.g. BTCE:BTCUSD
        description: `${symbol} Daily MOVE Contract for ${this._formatDate(moveForSymbol.openDate)}`,
        supported_resolutions: supportedRes,
        intraday_multipliers: availableMultipliers,
        has_intraday: true,
        exchange: "FTX",
        session: "24x7",
        timezone: "Etc/UTC",
        minmov: 5,
        pricescale: 10,
        data_status: "endofday",
        currency_code: "USD",
        // ticker: "<symbol ticker name, optional>",
        type: "futures",
        expired: !!moveForSymbol.closeDate,
        expiration_date: moveForSymbol.closeDate && this._timestampFromDate(moveForSymbol.closeDate),
      };
    };

    const searchSymbols = (userInput, exchange, symbolType, callback) => {
      const availableMoves = availableMovesData && availableMovesData.availableMoves;
      let userInputWithoutDash = userInput.replace(/-/g, " ");
      callback(availableMoves
      .filter(move => (move.symbol.includes(userInput) || move.symbol.includes(userInputWithoutDash)))
      .map(move => symbolInfosFromSymbol(move.symbol)));
    };

    const resolveSymbol = (symbolName, onSymbolResolvedCallback, onResolveErrorCallback, extension) => {
      setTimeout(() => onSymbolResolvedCallback(symbolInfosFromSymbol(symbolName)), 0);
    };

    const getBars = (symbolInfo, resolution, from, to, onHistoryCallback, onErrorCallback, firstDataRequest) => {
      const symbol = symbolInfo.symbol;
      const timeframe = TVtoHC(resolution);
      const startTime = new Date(from*1000);
      this._lastMoveRequested = symbol;
      const moveForSymbol = availableMovesData && availableMovesData.availableMoves &&
        availableMovesData.availableMoves.find(move => move.symbol === symbol);
      const endTime = firstDataRequest || !to? moveForSymbol.closeDate : new Date(to*1000);

      if (endTime && moment(endTime).isBefore(moveForSymbol.openAsFutureDate)) {
        setTimeout(() => onHistoryCallback([], {noData: true}), 0);
        return;
      }
      apolloClient.query({
        query: moveOhlcRangeQueryDocument,
        variables: {
          symbol,
          timeframe,
          startTime,
          endTime,
        },
      })
      .then((res: {data:{move: MoveWithOhlc}}) => {
        const move = res.data && res.data.move;
        if (!move) {
          onErrorCallback("error");
          return;
        }
        onHistoryCallback(this._formatData(move.ohlc));
      },(err) => {
        console.error(err);
        onErrorCallback("error");
      });
    };

    const calculateHistoryDepth = (resolution, resolutionBack, intervalBack) => {
      let res;
      switch (resolution) {
        case "1":
        case "3":
          res = {
            resolutionBack: "60",
            intervalBack: 4,
          };
          break;
        case "5":
          res = {
            resolutionBack: "60",
            intervalBack: 20,
          };
          break;
        case "15":
        case "30":
          res = {
            resolutionBack: "D",
            intervalBack: 2,
          };
          break;
        case "60":
        case "120":
        case "240":
        case "360":
        case "720":
          res = {
            resolutionBack: "D",
            intervalBack: 4,
          };
          break;
        default:
          res = undefined;
      }
      return res;
    };

    this.setState({
      datafeed: {
        onReady,
        searchSymbols,
        resolveSymbol,
        getBars,
        calculateHistoryDepth,
      },
    });
  }
  _formatDate: Function = (dateStr) => {
    return moment(dateStr).format("dddd, MMMM Do YYYY");
  };
  _timestampFromDate: Function = (dateString) => {
    return moment(dateString).unix();
  }
  _formatData: Function = (ohlc) => {
    return ohlc.map(candle => ({
      time: candle.timestamp*1000,
      open: candle.open,
      close: candle.close,
      high: candle.high,
      low: candle.low,
      volume: candle.volume,
    }));
  }
  _formatAndFilterData: Function = (ohlc, startTimestamp, endTimestamp) => {
    const res = ohlc.filter(candle => candle.timestamp >= startTimestamp && candle.timestamp < endTimestamp).map(candle => ({
      time: candle.timestamp*1000,
      open: candle.open,
      close: candle.close,
      high: candle.high,
      low: candle.low,
      volume: candle.volume,
    }));
    if (res.length === 0) {
      return {noData: true};
    } else {
      return {
        formattedOhlc: res,
      };
    }
  }
}

const gqlConnect = graphql(availableMovesQueryDocument, {
  name: "availableMovesData",
  options: () => ({
    fetchPolicy: "cache-and-network",
  }),
});

const reduxConnect = connect(
  state => ({
  }),
  dispatch => ({
  })
);

export default compose(
  withTranslation(["browser"]),
  reduxConnect,
  gqlConnect,
)(Charts);
