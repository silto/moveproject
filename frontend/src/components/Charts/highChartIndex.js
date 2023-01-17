/* @flow */

import React, { Component } from "react";
import { connect } from "react-redux";
import { compose } from "redux";
import { graphql, Query } from "react-apollo";
import styled from "styled-components";
import { withTranslation } from "react-i18next";
import type { TFunction } from "react-i18next";
import {
  availableMovesQueryDocument,
  moveOhlcQueryDocument,
} from "../../gqlRequests/queries";
import Container from "../Container";
import ChartZone from "../Container/ChartZone";
import Title from "../Title";
import Select from "../Select";
import Loader from "../Loader";
import CandleChart from "../Graphs/CandleChart";
import ErrorMessage from "../Error/ErrorMessage";
import { trackEvent } from "../../analytics";

import type { MoveWithOhlc } from "../../gqlRequests/queries";

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
  selectedMoveId: ?string,
  timeframe: string,
};

class Charts extends Component<
  ChartsProps,
  ChartsState
> {
  props: ChartsProps;
  state: ChartsState;
  _fetchingNextPage: boolean;

  constructor(props: ChartsProps) {
    super(props);
    this.state = {
      selectedMoveId: "",
      timeframe: "15m",
    };
  }

  render() {
    const { t, availableMovesData } = this.props;
    const {
      selectedMoveId,
      timeframe,
    } = this.state;
    const availableMoves = availableMovesData && !availableMovesData.loading && availableMovesData.availableMoves;
    const tmpMoveId = availableMoves && availableMoves[availableMoves.length - 1].id;
    return <ChartFeed>
      <Container>
        <ChartZone>
          <Title>{t("charts.title")}</Title>
          <div className="selector">
            {availableMoves && <Select
              id="selectMove"
              label={t("fields.selectMove")}
              name="selectMove"
              className="form-control"
              placeholder={t("fields.contractPlaceholder")}
              value={selectedMoveId || tmpMoveId}
              items={[{
                label: t("fields.contractPlaceholder"),
                value: "",
              }].concat(availableMoves.slice().reverse().map(moveRef => ({
                label: moveRef.symbol,
                value: moveRef.id,
              })))}
              onChange={value => {
                const moveInfo = value && availableMoves.find(move => move.id === value);
                if (moveInfo) {
                  trackEvent({
                    category: "select",
                    action: `select chart ${moveInfo.symbol}`,
                  });
                }
                this._handleSelectChange("selectedMoveId", value);
              }}
            />}
          </div>
          {(selectedMoveId || tmpMoveId) && <Query query={moveOhlcQueryDocument} variables={{
            moveId: selectedMoveId || tmpMoveId,
            timeframe,
          }}>
            {({ loading, error, data}: {loading: boolean, error: Error, data: {move: MoveWithOhlc}}) => {
              if (loading && (!data || !data.move)) {
                return <Loader/>;
              }
              if (error) {
                console.error(error);
                return <ErrorMessage>{t("common:error")}</ErrorMessage>;
              }
              if (!data || !data.move || data.move.ohlc.length === 0) {
                return null;
              }
              const formattedData = this._formatData(data.move.ohlc);
              const title = data.move.symbol;
              const serieTitle = data.move.symbol;
              return (
                <div>
                  <CandleChart
                    title={title}
                    dataVersion={loading? "loading" : `${selectedMoveId || tmpMoveId}-${timeframe}`}
                    serie={{
                      name: serieTitle,
                      priceData: formattedData.price,
                      volumeData: formattedData.volume,
                      timeframe,
                    }}
                    onTimeframeChange={this._setNewTimeframe}
                  />
                </div>
              );
            }}
          </Query>}
        </ChartZone>
      </Container>
    </ChartFeed>;
  }
  _handleSelectChange: Function = (target, value) => {
    this.setState({ [target]: value });
  }

  _setNewTimeframe: Function = (newTimeframe) => {
    trackEvent({
      category: "chart",
      action: `select timeframe ${newTimeframe}`,
      name: "timeframe",
    });
    this.setState({ timeframe: newTimeframe });
  }

  _formatData: Function = (ohlc) => {
    let data = {
      price: [],
      volume: [],
    };
    ohlc.forEach(candle => {
      data.price.push([
        candle.timestamp*1000,
        candle.open,
        candle.high,
        candle.low,
        candle.close,
      ]);
      data.volume.push([
        candle.timestamp*1000,
        candle.volume,
        candle.open <= candle.close? 1 : -1,
      ]);
    });
    return data;
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
