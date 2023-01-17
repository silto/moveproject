/* @flow */

import React, { Component } from "react";
import { connect } from "react-redux";
import { Query } from "react-apollo";
import { compose } from "redux";
import styled from "styled-components";
import { withTranslation } from "react-i18next";
import type { TFunction } from "react-i18next";
import {
  expirationHistoryQueryDocument,
} from "../../../gqlRequests/queries";
import Container from "../../Container";
import ChartZone from "../../Container/ChartZone";
import Title from "../../Title";
import Select from "../../Select";
import Toggle from "../../Toggle";
import Loader from "../../Loader";
import LineChart from "../../Graphs/LineChart";
import ErrorMessage from "../../Error/ErrorMessage";
import { trackEvent } from "../../../analytics";

import type { Expiration } from "../../../gqlRequests/queries";

const Text = styled.div`
  font-family: Open Sans;
  color: ${({ theme }) => theme.normalText};
  font-weight: 400;
  font-size: 13px;
  white-space: pre-wrap;
  margin: auto;
  max-width: 800px;
  > p.centered {
    text-align: center;
  }
  .action {
    &:hover {
      text-decoration: underline;
    }
    font-weight: 600;
    cursor: pointer;
    color: ${({ theme }) => theme.action};
  }
`;

type ExpirationHistoryProps = {
  t: TFunction,
};

type ExpirationHistoryState = {
  normalizedToPosition: ?number,
  minmax: boolean,
  minmaxAfterNormCandle: boolean,
};

class ExpirationHistory extends Component<
  ExpirationHistoryProps,
  ExpirationHistoryState
> {
  props: ExpirationHistoryProps;
  state: ExpirationHistoryState;
  _fetchingNextPage: boolean;

  constructor(props: ExpirationHistoryProps) {
    super(props);
    this.state = {
      normalizedToPosition: -1,
      minmax: false,
      minmaxAfterNormCandle: false,
    };
  }

  render() {
    const { t } = this.props;
    const {
      normalizedToPosition,
      minmax,
      minmaxAfterNormCandle,
    } = this.state;

    return <Container>
      <ChartZone>
        <Title>{t("analytics.expirationHistory.title")}</Title>
        <div className="selector">
          <Select
            id="selectNormalizationExpirationHistory"
            label={t("fields.normalize")}
            name="normalizedToPosition"
            className="form-control"
            infoTooltip={t("analytics.expirationHistory.normalizeExplanation1")}
            placeholder={t("fields.normalizationPlaceholder")}
            value={`${normalizedToPosition}`}
            items={[{
              label: t("fields.noNorm"),
              value: "-1",
            }].concat([...Array(48).keys()].map((_,i) => {
              let label;
              if (i === 0) {
                label = "00:00 - Future (Open as Future)";
              } else if (i === 24) {
                label = "00:00 - MOVE (Open as MOVE contract)";
              } else {
                label = `${`${i%24}`.length === 2? "" : "0"}${i%24}:00 - ${i < 24? "Future" : "MOVE"}`;
              }
              return {
                label,
                value: `${i}`,
              };
            }))}
            onChange={value => {
              trackEvent({
                category: "select",
                action: `select norm candle`,
                name: "select norm candle for expiration history",
                value: parseInt(value),
              });
              this._handleSelectChange("normalizedToPosition", parseInt(value));
            }}
          />
        </div>
        <Text>
          <p className="centered">
            <span className="action" onClick={() => {
              trackEvent({
                category: "select",
                action: `select norm candle`,
                name: "try norm for expiration history",
                value: parseInt(24),
              });
              this.setState({normalizedToPosition: 24});
            }}>
              {t("analytics.expirationHistory.try")}
            </span>
          </p>
        </Text>
        <div className="toggle">
          <Toggle
            id="expirationMinMaxToggle"
            labelRight={t("fields.toggleMinMax")}
            infoTooltip={t("analytics.expirationHistory.minmaxExplanation")}
            name="minmax"
            checked={minmax}
            twoSided={false}
            onChange={(checked) => {
              this._handleSelectChange("minmax", checked);
            }}
          />
        </div>
        {minmax && normalizedToPosition >= 0 && <div className="toggle">
          <Toggle
            id="expirationMinMaxAfterNormCandleToggle"
            labelRight={t("fields.toggleMinMaxAfterNormCandle")}
            infoTooltip={t("analytics.expirationHistory.minmaxAfterNormExplanation")}
            name="minmaxAfterNormCandle"
            checked={minmaxAfterNormCandle}
            twoSided={false}
            onChange={(checked) => {
              this._handleSelectChange("minmaxAfterNormCandle", checked);
            }}
          />
        </div>}
        <Query key="expirationHistoryQuery" query={expirationHistoryQueryDocument} variables={{
          normalizedToPosition: normalizedToPosition >= 0? normalizedToPosition : null,
          minmax,
          minmaxAfterNormCandle,
        }}>
          {({ loading, error, data}: {loading: boolean, error: Error, data: {expirations: Array<Expiration>}}) => {
            if (loading && (!data || !data.expirations)) {
              return <Loader/>;
            }
            if (error) {
              console.error(error);
              return <ErrorMessage>{t("common:error")}</ErrorMessage>;
            }
            if (!data || data.expirations.length === 0) {
              return null;
            }
            const expirationData = this._formatData(data.expirations);
            const title = `${
              t("analytics.expirationHistory.title")
            } ${
              normalizedToPosition >= 0? `normalized to ${
                `${normalizedToPosition}`.length === 2? "" : "0"
              }${normalizedToPosition % 24}:00 - ${normalizedToPosition < 24? "Future" : "MOVE"
              }` : ""
            }`;
            let series = [{
              id: "exp",
              data: expirationData.expirations,
              name: `${normalizedToPosition >= 0? "normalized " : ""} expiration price`,
            }];
            if (minmax) {
              series = series.concat([
                {
                  id: "min",
                  data: expirationData.min,
                  color: "#063879",
                  lineWidth: 1,
                  name: `${
                    normalizedToPosition >= 0? "normalized " : ""
                  }min price${
                    minmaxAfterNormCandle? " after normalization candle" : ""
                  }`,
                },
                {
                  id: "max",
                  data: expirationData.max,
                  color: "#063879",
                  lineWidth: 1,
                  name: `${
                    normalizedToPosition >= 0? "normalized " : ""
                  }max price${
                    minmaxAfterNormCandle? " after normalization candle" : ""
                  }`,
                },
              ]);
            }
            return (
              <div>
                <LineChart
                  title={title}
                  dataVersion={loading? "loading" : `${normalizedToPosition}${minmax?"-minmax":""}${minmaxAfterNormCandle?"-afterNorm":""}`}
                  series={series}
                  isNormalized={normalizedToPosition >= 0}
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

  _formatData: Function = (expirations) => {
    const { minmax } = this.state;
    let data = {
      expirations: [],
    };
    if (minmax) {
      data.min = [];
      data.max = [];
    }
    expirations.forEach(expiration => {
      const timestamp = new Date(expiration.openDate).getTime();
      data.expirations.push([
        timestamp,
        expiration.expirationPrice,
      ]);
      if (minmax) {
        data.min.push([
          timestamp,
          expiration.min,
        ]);
        data.max.push([
          timestamp,
          expiration.max,
        ]);
      }
    });
    return data;
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
)(ExpirationHistory);
