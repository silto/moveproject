/* @flow */

import React, { Component } from "react";
import { connect } from "react-redux";
import { compose } from "redux";
import { graphql, Query } from "react-apollo";
import styled from "styled-components";
import { withTranslation, Trans } from "react-i18next";
import type { TFunction } from "react-i18next";
import {
  availableMovesQueryDocument,
  moveTradesQueryDocument,
  moveTradesSummaryQueryDocument,
} from "../../../gqlRequests/queries";
import Container from "../../Container";
import ChartZone from "../../Container/ChartZone";
import Title from "../../Title";
import Select from "../../Select";
import Loader from "../../Loader";
import Spinner from "../../Loader/Spinner";
import BubbleChart from "../../Graphs/BubbleChart";
import ErrorMessage from "../../Error/ErrorMessage";
import { trackEvent } from "../../../analytics";

import type { MoveWithTrades, MoveWithTradesSummary } from "../../../gqlRequests/queries";


type TradesProps = {
  t: TFunction,
  availableMovesData: {
    availableMoves?: Array<{
      id: string,
      symbol: string,
    }>,
    loading: boolean,
  }
};

type TradesState = {
  selectedMoveId: ?string,
  allTradesLoaded: boolean,
};

class Trades extends Component<
  TradesProps,
  TradesState
> {
  props: TradesProps;
  state: TradesState;
  _fetchingNextPage: boolean;

  constructor(props: TradesProps) {
    super(props);
    this.state = {
      selectedMoveId: "",
      allTradesLoaded: false,
    };
  }

  render() {
    const { t, availableMovesData } = this.props;
    const {
      selectedMoveId,
      allTradesLoaded,
    } = this.state;
    const availableMoves = availableMovesData && !availableMovesData.loading && availableMovesData.availableMoves;
    const tmpMoveId = availableMoves && availableMoves[0].id;
    return <Container>
      <ChartZone>
        <Title>{t("analytics.trades.title")}</Title>
        <div className="selector">
          {availableMoves && <Select
            id="selectMoveForTrades"
            label={t("fields.selectMove")}
            name="selectMove"
            className="form-control"
            placeholder={t("fields.contractPlaceholder")}
            value={selectedMoveId || tmpMoveId}
            items={[{
              label: t("fields.contractPlaceholder"),
              value: "",
            }].concat(availableMoves.slice().map(moveRef => ({
              label: moveRef.symbol,
              value: moveRef.id,
            })))}
            onChange={value => {
              const moveInfo = value && availableMoves.find(move => move.id === value);
              if (moveInfo) {
                trackEvent({
                  category: "select",
                  action: `select trades chart ${moveInfo.symbol}`,
                });
              }
              this._handleSelectChange("selectedMoveId", value);
            }}
          />}
        </div>
        {(selectedMoveId || tmpMoveId) && <Query key="moveTradesSummaryQuery" query={moveTradesSummaryQueryDocument} variables={{
          moveId: selectedMoveId || tmpMoveId,
        }}>
          {({ loading, error, data}: {loading: boolean, error: Error, data: {move: MoveWithTradesSummary}}) => {
            if (loading && data && data.move) {
              return <div className="infoSummaryPlaceHolder"><Spinner/></div>;
            }
            if (error) {
              console.error(error);
              return <ErrorMessage>{t("common:error")}</ErrorMessage>;
            }
            if (!data || !data.move || !data.move.tradesSummary) {
              return null;
            }
            const {
              buy,
              sell,
              liqBuy,
              liqSell,
              buyCount,
              sellCount,
              liqBuyCount,
              liqSellCount,
            } = data.move.tradesSummary;
            return <div className="infoSummary">
              <h3>{t("analytics.trades.tradesSummary")}</h3>
              <div className="textLine">
                <span>
                  <Trans
                    t={t}
                    i18nKey="analytics.trades.buys"
                    count={buyCount}
                    values={{
                      buy: Math.round(buy*10000)/10000,
                      buyCount,
                    }}
                    components={{ b: <strong /> }}
                  />
                </span><div className="separator"/>
                <span>
                  <Trans
                    t={t}
                    i18nKey="analytics.trades.liqBuys"
                    count={liqBuyCount}
                    values={{
                      liqBuy: Math.round(liqBuy*10000)/10000,
                      liqBuyCount,
                    }}
                    components={{ b: <strong /> }}
                  />
                </span>
              </div>
              <div className="textLine">
                <span>
                  <Trans
                    t={t}
                    i18nKey="analytics.trades.sells"
                    count={sellCount}
                    values={{
                      sell: Math.round(sell*10000)/10000,
                      sellCount,
                    }}
                    components={{ b: <strong /> }}
                  />
                </span><div className="separator"></div>
                <span>
                  <Trans
                    t={t}
                    i18nKey="analytics.trades.liqSells"
                    count={liqSellCount}
                    values={{
                      liqSell: Math.round(liqSell*10000)/10000,
                      liqSellCount,
                    }}
                    components={{ b: <strong /> }}
                  />
                </span>
              </div>
            </div>;
          }}
        </Query>}
        {(selectedMoveId || tmpMoveId) && <Query key="moveTradesQuery" query={moveTradesQueryDocument} variables={{
          moveId: selectedMoveId || tmpMoveId,
        }}>
          {({ loading, error, data, fetchMore}: {loading: boolean, error: Error, data: {move: MoveWithTrades}, fetchMore: Function}) => {
            if (loading && (!data || !data.move)) {
              return <Loader/>;
            }
            if (error) {
              console.error(error);
              return <ErrorMessage>{t("common:error")}</ErrorMessage>;
            }
            if (!data || !data.move || data.move.trades.length === 0) {
              return null;
            }
            if (
              data.move.id === (selectedMoveId || tmpMoveId) &&
              !this._fetchingNextPage &&
              !allTradesLoaded &&
              !data.move.allTradesLoaded
            ) {
              this._fetchingNextPage = true;
              fetchMore({
                variables: {
                  moveId: selectedMoveId || tmpMoveId,
                  startTime: data.move.trades[data.move.trades.length - 1].date,
                },
                updateQuery: (prev, { fetchMoreResult }) => {
                  if (!fetchMoreResult || !fetchMoreResult.move || !fetchMoreResult.move.trades){
                    return prev;
                  }
                  let lastKnowTradeIdx = fetchMoreResult.move.trades.findIndex(trade =>
                    trade.id === prev.move.trades[prev.move.trades.length - 1].id
                  );
                  let allTradesLoadedTmp = false;
                  if (fetchMoreResult.move.trades.length < 1000) {
                    this.setState({
                      allTradesLoaded: true,
                    });
                    allTradesLoadedTmp = true;
                  }
                  this._fetchingNextPage = false;
                  if (lastKnowTradeIdx === fetchMoreResult.move.trades.length - 1) {
                    return prev;
                  }
                  return {
                    ...fetchMoreResult,
                    move: {
                      ...fetchMoreResult.move,
                      ...prev.move,
                      allTradesLoaded: allTradesLoadedTmp,
                      trades: [
                        ...prev.move.trades,
                        ...fetchMoreResult.move.trades.slice(lastKnowTradeIdx + 1),
                      ],
                    },
                  };
                },
              }).catch((e) => console.info(e));
            }
            const formattedData = this._formatData(data.move.trades);
            const title = data.move.symbol;
            const serieTitle = data.move.symbol;
            return (
              <div>
                <BubbleChart
                  title={title}
                  dataVersion={loading? "loading" : `${selectedMoveId || tmpMoveId} ${data.move.trades.length}`}
                  serie={{
                    name: serieTitle,
                    tradesData: formattedData,
                  }}
                />
              </div>
            );
          }}
        </Query>}
      </ChartZone>
    </Container>;
  }
  _handleSelectChange: Function = (target, value) => {
    this.setState({ [target]: value, allTradesLoaded: false });
  }


  _formatData: Function = (trades) => {
    let data = {
      buy: [],
      sell: [],
      liqBuy: [],
      liqSell: [],
    };
    trades.forEach(trade => {
      let dest = trade.side === "buy"?
        (trade.liquidation? data.liqBuy : data.buy) :
        (trade.liquidation? data.liqSell : data.sell);
      dest.push([
        trade.timestamp * 1000,
        trade.price,
        trade.size,
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
)(Trades);
