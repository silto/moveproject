/* @flow */

import React, { Component, Fragment } from "react";
import { connect } from "react-redux";
import { Query } from "react-apollo";
import { compose } from "redux";
import styled from "styled-components";
import { withTranslation } from "react-i18next";
import type { TFunction } from "react-i18next";
import config from "../../../config";
import {
  ivHistoryQueryDocument,
  ivWithBTCHistoryQueryDocument,
} from "../../../gqlRequests/queries";
import Container from "../../Container";
import ChartZone from "../../Container/ChartZone";
import Title from "../../Title";
import Loader from "../../Loader";
import Toggle from "../../Toggle";
import LineChart from "../../Graphs/LineChart";
import ErrorMessage from "../../Error/ErrorMessage";
import SimpleTextTooltip from "../../Tooltips/SimpleTextTooltip";

import type { IV, BTCOHLCForIV } from "../../../gqlRequests/queries";

const Text = styled.div`
  font-family: Open Sans;
  color: ${({ theme }) => theme.normalText};
  font-weight: 400;
  font-size: 15px;
  white-space: pre-wrap;
  margin: auto;
  max-width: 800px;
  .infosWrapper {
    width: fit-content;
    margin: auto;
  }
  p.centered {
    text-align: center;
  }
  p.infos {
    color: ${({ theme }) => theme.primary};
    cursor: pointer;
  }
`;

type IVHistoryProps = {
  t: TFunction,
};

type IVHistoryState = {
  ivAlign: string,
  withBTC: boolean,
};

class IVHistory extends Component<
  IVHistoryProps,
  IVHistoryState
> {
  props: IVHistoryProps;
  state: IVHistoryState;
  _fetchingNextPage: boolean;

  constructor(props: IVHistoryProps) {
    super(props);
    this.state = {
      ivAlign: "byContract",
      withBTC: false,
    };
  }

  render() {
    const { t } = this.props;
    const { ivAlign, withBTC } = this.state;
    return <Container>
      <ChartZone>
        <Title>{t("analytics.ivHistory.title")}</Title>
        <Text>
          <SimpleTextTooltip
            text={<Fragment>
              <p className="centered">{t("analytics.ivHistory.explanation1")}</p>
              <p className="centered">{t("analytics.ivHistory.explanation2")}</p>
            </Fragment>}
            maxWidth={600}
          >
            <div className="infosWrapper">
              <p className="centered infos">{t("analytics.ivHistory.whatIsIV")}</p>
            </div>
          </SimpleTextTooltip>
          <p className="centered">{t("analytics.ivHistory.explanationIVFuture")}</p>
          <p className="centered">{t("analytics.ivHistory.explanationIVOpen")}</p>
        </Text>
        <div className="toggle">
          <Toggle
            id="ivAlignmentToggle"
            labelLeft={t("fields.ivAlignByDate")}
            labelRight={t("fields.ivAlignByContract")}
            name="ivAlign"
            checked={ivAlign === "byContract"}
            twoSided={true}
            infoTooltip={t("analytics.ivHistory.alignmentExplanation")}
            onChange={(checked) => {
              this._handleSelectChange("ivAlign", checked? "byContract" : "byDate");
            }}
          />
        </div>
        {config.showBTCData &&<div className="toggle">
          <Toggle
            id="ivWithBTCToggle"
            labelRight={t("fields.toggleWithBTC")}
            name="withBTC"
            checked={withBTC}
            twoSided={false}
            onChange={(checked) => {
              this._handleSelectChange("withBTC", checked);
            }}
          />
        </div>}
        <Query key="ivHistoryQuery" query={withBTC? ivWithBTCHistoryQueryDocument : ivHistoryQueryDocument}>
          {({ loading, error, data}: {
            loading: boolean,
            error: Error,
            data: {
              moves: Array<IV>,
              btcohlc?: Array<BTCOHLCForIV>,
            }
          }) => {
            if (loading && (!data || !data.moves)) {
              return <Loader/>;
            }
            if (error) {
              console.error(error);
              return <ErrorMessage>{t("common:error")}</ErrorMessage>;
            }
            if (!data || data.moves.length === 0) {
              return null;
            }
            const ivHistoryData = this._formatData(data.moves);
            const btcHistory = withBTC && data.btcohlc && this._formatBtcData(data.btcohlc);
            const title = t("analytics.ivHistory.title");
            return (
              <div>
                <LineChart
                  title={title}
                  dataVersion={loading? "loading" : `${ivAlign}`}
                  series={[{
                    name: "IV Future",
                    data: ivHistoryData.IVFuture,
                  },{
                    name: "IV Open",
                    data: ivHistoryData.IVOpen,
                  }]}
                  btcSerie={btcHistory}
                  unit={"%"}
                />
              </div>
            );
          }}
        </Query>
      </ChartZone>
    </Container>;
  }

  _handleSelectChange: Function = (target, value) => {
    this.setState({ [target]: value });
  }

  _formatData: Function = (moves) => {
    const { ivAlign } = this.state;
    let data = {
      IVFuture: [],
      IVOpen: [],
    };
    moves.forEach(move => {
      const timestamp = new Date(move.openDate).getTime();
      data.IVFuture.push([
        ivAlign === "byContract"? timestamp : timestamp - 86400000,
        move.IVFuture * 100,
      ]);
      data.IVOpen.push([
        timestamp,
        move.IVOpen * 100,
      ]);
    });
    return data;
  }
  _formatBtcData: Function = (btcohlc) => {
    const { ivAlign } = this.state;
    let history = btcohlc;
    if (history.length === 0) {
      return [];
    }
    if (ivAlign === "byContract") {
      history = history.slice(1);
    }
    return history.map(ohlc => ([
      ohlc.timestamp * 1000,
      ohlc.open,
      ohlc.high,
      ohlc.low,
      ohlc.close,
    ]));
  }
}

const reduxConnect = connect(
  state => ({
  }),
  dispatch => ({
  })
);

export default compose(
  withTranslation(["browser"]),
  reduxConnect,
)(IVHistory);
