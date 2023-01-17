/* @flow */

import React, { Component } from "react";
import { connect } from "react-redux";
import { Query } from "react-apollo";
import { compose } from "redux";
import styled from "styled-components";
import { withTranslation } from "react-i18next";
import type { TFunction } from "react-i18next";
import {
  expirationPerDayOfWeekQueryDocument,
  expirationPerMonthQueryDocument,
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

import type { ExpirationPerDayOfWeek, ExpirationPerMonth } from "../../../gqlRequests/queries";

type ExpirationAveragesProps = {
  t: TFunction,
};

type ExpirationAveragesState = {
  normalizedToPosition: ?number,
  weeklyMonthly: string,
};

class ExpirationAverages extends Component<
  ExpirationAveragesProps,
  ExpirationAveragesState
> {
  props: ExpirationAveragesProps;
  state: ExpirationAveragesState;

  constructor(props: ExpirationAveragesProps) {
    super(props);
    this.state = {
      normalizedToPosition: -1,
      weeklyMonthly: "weekly",
    };
  }

  render() {
    const { t } = this.props;
    const {
      normalizedToPosition,
      weeklyMonthly,
    } = this.state;

    return <Container>
      <ChartZone>
        <Title>{t("analytics.expirationAverages.title")}</Title>
        <div className="selector">
          <Select
            id="selectNormalizationExpirationAverages"
            label={t("fields.normalize")}
            infoTooltip={t("analytics.expirationHistory.normalizeExplanation1")}
            name="normalizedToPosition"
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
                name: "select norm candle for expiration averages",
                value: parseInt(value),
              });
              this._handleSelectChange("normalizedToPosition", parseInt(value));
            }}
          />
        </div>
        <div className="toggle">
          <Toggle
            id="expirationWeeklyMonthlyToggle"
            labelLeft={t("fields.toggleWeekly")}
            labelRight={t("fields.toggleMonthly")}
            name="weeklyMonthly"
            checked={weeklyMonthly === "monthly"}
            twoSided={true}
            onChange={(checked) => {
              this._handleSelectChange("weeklyMonthly", checked? "monthly" : "weekly");
            }}
          />
        </div>
        {weeklyMonthly === "weekly"?
          <Query key="expirationPerDayOfWeekQuery" query={expirationPerDayOfWeekQueryDocument} variables={{
            normalizedToPosition: normalizedToPosition >= 0? normalizedToPosition : null,
          }}>
            {({ loading, error, data}: {loading: boolean, error: Error, data: {weeklyExpirationAvg: ExpirationPerDayOfWeek}}) => {
              if (loading && (!data || !data.weeklyExpirationAvg)) {
                return <Loader/>;
              }
              if (error) {
                console.error(error);
                return <ErrorMessage>{t("common:error")}</ErrorMessage>;
              }
              if (!data || !data.weeklyExpirationAvg) {
                return null;
              }
              const expirationFormatted = this._formatDailyData(data.weeklyExpirationAvg);
              const title = `${
                t("analytics.expirationAverages.chartTitleDaily")
              } ${
                normalizedToPosition >= 0? `normalized to ${
                  `${normalizedToPosition}`.length === 2? "" : "0"
                }${normalizedToPosition % 24}:00 - ${normalizedToPosition < 24? "Future" : "MOVE"
                }` : ""
              }`;
              const serieTitle = `${normalizedToPosition >= 0? "normalized " : ""} average expiration price`;
              return (
                <div>
                  <BarChart
                    title={title}
                    dataVersion={loading? "loading" : `${normalizedToPosition}`}
                    serie={{
                      data: expirationFormatted,
                      name: serieTitle,
                    }}
                    isNormalized={normalizedToPosition >= 0}
                  />
                </div>
              );
            }}
          </Query> :
          <Query key="expirationPerMonthQuery" query={expirationPerMonthQueryDocument} variables={{
            normalizedToPosition: normalizedToPosition >= 0? normalizedToPosition : null,
          }}>
            {({ loading, error, data}: {loading: boolean, error: Error, data: {monthlyExpirationAvg: ExpirationPerMonth}}) => {
              if (loading && (!data || !data.monthlyExpirationAvg)) {
                return <Loader/>;
              }
              if (error) {
                console.error(error);
                return <ErrorMessage>{t("common:error")}</ErrorMessage>;
              }
              if (!data || !data.monthlyExpirationAvg) {
                return null;
              }
              const expirationFormatted = this._formatMonthlyData(data.monthlyExpirationAvg);
              const title = `${
                t("analytics.expirationAverages.chartTitleMonthly")
              } ${
                normalizedToPosition >= 0? `normalized to ${
                  `${normalizedToPosition}`.length === 2? "" : "0"
                }${normalizedToPosition % 24}:00 - ${normalizedToPosition < 24? "Future" : "MOVE"
                }` : ""
              }`;
              const serieTitle = `${normalizedToPosition >= 0? "normalized " : ""} average expiration price`;
              return (
                <div>
                  <BarChart
                    title={title}
                    dataVersion={loading? "loading" : `${normalizedToPosition}`}
                    serie={{
                      data: expirationFormatted,
                      name: serieTitle,
                    }}
                    isNormalized={normalizedToPosition >= 0}
                  />
                </div>
              );
            }}
          </Query>
        }
      </ChartZone>
    </Container>;
  }

  _handleSelectChange: Function = (target, value) => {
    this.setState({ [target]: value });
  }

  _formatDailyData: Function = (dailyAvgs) => {
    const {t} = this.props;
    return [
      [t("common:days.mon"), dailyAvgs.mon - dailyAvgs.mon % 0.001],
      [t("common:days.tue"), dailyAvgs.tue - dailyAvgs.tue % 0.001],
      [t("common:days.wed"), dailyAvgs.wed - dailyAvgs.wed % 0.001],
      [t("common:days.thu"), dailyAvgs.thu - dailyAvgs.thu % 0.001],
      [t("common:days.fri"), dailyAvgs.fri - dailyAvgs.fri % 0.001],
      [t("common:days.sat"), dailyAvgs.sat - dailyAvgs.sat % 0.001],
      [t("common:days.sun"), dailyAvgs.sun - dailyAvgs.sun % 0.001],
    ];
  }
  _formatMonthlyData: Function = (monthlyAvgs) => {
    const {t} = this.props;
    return [
      [t("common:months.jan"), monthlyAvgs.jan - monthlyAvgs.jan % 0.001],
      [t("common:months.feb"), monthlyAvgs.feb - monthlyAvgs.feb % 0.001],
      [t("common:months.mar"), monthlyAvgs.mar - monthlyAvgs.mar % 0.001],
      [t("common:months.apr"), monthlyAvgs.apr - monthlyAvgs.apr % 0.001],
      [t("common:months.may"), monthlyAvgs.may - monthlyAvgs.may % 0.001],
      [t("common:months.jun"), monthlyAvgs.jun - monthlyAvgs.jun % 0.001],
      [t("common:months.jul"), monthlyAvgs.jul - monthlyAvgs.jul % 0.001],
      [t("common:months.aug"), monthlyAvgs.aug - monthlyAvgs.aug % 0.001],
      [t("common:months.sep"), monthlyAvgs.sep - monthlyAvgs.sep % 0.001],
      [t("common:months.oct"), monthlyAvgs.oct - monthlyAvgs.oct % 0.001],
      [t("common:months.nov"), monthlyAvgs.nov - monthlyAvgs.nov % 0.001],
      [t("common:months.dec"), monthlyAvgs.dec - monthlyAvgs.dec % 0.001],
    ];
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
)(ExpirationAverages);
