/* @flow */

import React, { Component } from "react";
import { connect } from "react-redux";
import { Query } from "react-apollo";
import { compose } from "redux";
import styled from "styled-components";
import { withTranslation } from "react-i18next";
import type { TFunction } from "react-i18next";
import {
  expirationDistributionQueryDocument,
} from "../../../gqlRequests/queries";
import Container from "../../Container";
import ChartZone from "../../Container/ChartZone";
import Title from "../../Title";
import Select from "../../Select";
import Toggle from "../../Toggle";
import Loader from "../../Loader";
import BarChart from "../../Graphs/BarChart";
import ErrorMessage from "../../Error/ErrorMessage";
import { trackEvent } from "../../../analytics";

import type { ExpirationDistribution } from "../../../gqlRequests/queries";

type ExpirationDistributionProps = {
  t: TFunction,
};

type ExpirationDistributionState = {
  normalizedToPosition: ?number,
};

class ExpirationDistributionChart extends Component<
  ExpirationDistributionProps,
  ExpirationDistributionState
> {
  props: ExpirationDistributionProps;
  state: ExpirationDistributionState;

  constructor(props: ExpirationDistributionProps) {
    super(props);
    this.state = {
      normalizedToPosition: -1,
    };
  }

  render() {
    const { t } = this.props;
    const {
      normalizedToPosition,
    } = this.state;

    return <Container>
      <ChartZone>
        <Title>{t("analytics.expirationDistribution.title")}</Title>
        <div className="selector">
          <Select
            id="selectNormalizationExpirationDistribution"
            label={t("fields.normalize")}
            name="normalizedToPosition"
            infoTooltip={t("analytics.expirationHistory.normalizeExplanation1")}
            className="form-control"
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
                name: "select norm candle for expiration distribution",
                value: parseInt(value),
              });
              this._handleSelectChange("normalizedToPosition", parseInt(value));
            }}
          />
        </div>
        <Query key="expirationDistributionQuery" query={expirationDistributionQueryDocument} variables={{
          normalizedToPosition: normalizedToPosition >= 0? normalizedToPosition : null,
        }}>
          {({ loading, error, data}: {loading: boolean, error: Error, data: {expirationDistribution: ExpirationDistribution}}) => {
            if (loading && (!data || !data.expirationDistribution)) {
              return <Loader/>;
            }
            if (error) {
              console.error(error);
              return <ErrorMessage>{t("common:error")}</ErrorMessage>;
            }
            if (!data || !data.expirationDistribution || !data.expirationDistribution.distribution) {
              return null;
            }
            const expirationDistributionFormatted = this._formatDistributionData(data.expirationDistribution.distribution);
            const title = `${
              t("analytics.expirationDistribution.chartTitle")
            } ${
              normalizedToPosition >= 0? `normalized to ${
                `${normalizedToPosition}`.length === 2? "" : "0"
              }${normalizedToPosition % 24}:00 - ${normalizedToPosition < 24? "Future" : "MOVE"
              }` : ""
            }`;
            const serieTitle = `${normalizedToPosition >= 0? "normalized " : ""} expiration price distribution`;
            return (
              <div>
                <BarChart
                  title={title}
                  dataVersion={loading? "loading" : `${normalizedToPosition}`}
                  serie={{
                    data: expirationDistributionFormatted,
                    name: serieTitle,
                  }}
                  isNormalized={false}
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

  _formatDistributionData: Function = (distributionData) => {
    return distributionData.map((dataPoint, i) => ({
      name: dataPoint.range,
      x: i,
      y: dataPoint.count,
    }));
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
)(ExpirationDistributionChart);
