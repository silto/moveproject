/* @flow */

import React, { Component, Fragment } from "react";
import { connect } from "react-redux";
import { compose } from "redux";
import { graphql } from "react-apollo";
import styled from "styled-components";
import { withTranslation, Trans } from "react-i18next";
import type { TFunction } from "react-i18next";
import config from "../../config";
import {
  setBacktestId,
} from "../../actions";
import {
  backtestQueryDocument,
  createBacktestQuery,
} from "../../gqlRequests/queries";
import {
  startBacktestMutationDocument,
  startBacktestMutation,
  cancelBacktestMutationDocument,
  cancelBacktestMutation,
} from "../../gqlRequests/mutations";
import Container from "../Container";
import ChartZone from "../Container/ChartZone";
import TextField from "../TextField";
import Title from "../Title";
import Select from "../Select";
import Spinner from "../Loader/Spinner";
import Toggle from "../Toggle";
import Button from "../Button";
import CheckboxField from "../CheckboxField";

import LineChart from "../Graphs/LineChart";
import ErrorMessage, {formatError} from "../Error/ErrorMessage";
import { trackEvent } from "../../analytics";

import type { BacktestObject } from "../../gqlRequests/queries";

const BacktestFeed = styled.div`
  position: relative;
  padding-top: 56px;
`;

const BacktestConfig = styled.div`
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
`;
const Text = styled.div`
  font-family: Open Sans;
  color: ${({ theme }) => theme.normalText};
  font-weight: 400;
  font-size: 15px;
  white-space: pre-wrap;
  margin: auto;
  max-width: 1200px;

  .infosWrapper {
    width: fit-content;
    margin: auto;
  }
  &.basicText {
    margin: 0;
    text-align: left;
  }
  h4 {
    font-weight: 600;
    font-size: 17px;
  }
  p.centered {
    text-align: center;
  }
  p.infos {
    color: ${({ theme }) => theme.primary};
    cursor: pointer;
  }
`;
const StyledForm = styled.form`
  margin-top: 24px;
  margin-bottom: 40px;
  &:last-child {
    margin-bottom: 24px;
  }
  > button {
    margin-top: 20px;
  }
  > section {
    display: grid;
    grid-template-columns: 1fr;
    &.additionalSettingsToggle {
      margin-top: 10px;
    }
    @media (min-width: 860px) {
      grid-template-columns: 1fr;
      grid-column-gap: 50px;

      > fieldset + fieldset {
        padding-top: 0 !important;
      }
      &:nth-child(3) {
        grid-template-columns: 1fr 1fr;
      }
      &:nth-child(4) {
        grid-template-columns: 1fr 1fr;
      }
      &:nth-child(5) {
        grid-template-columns: 1fr 1fr;
      }
      &:nth-child(6) {
        grid-template-columns: 1fr 1fr;
      }
      & .uniqueField {
        width: 375px;
        margin: auto;
      }

    }

    & + section {
      padding-top: 24px;
    }
    > .toggleContainer {
      display: grid;
      grid-template-columns: 1fr;
      grid-template-rows: auto 40px;
      grid-template-areas: "label" "input";
      grid-gap: 8px;
      padding: 0 0;
      box-sizing: border-box;
      > .mainLabel {
        grid-area: label;
        text-align: center;
        color: ${({ theme }) => theme.form};
        font-family: Montserrat;
        font-weight: 600;
        font-size: 12px;
        line-height: 16px;
        text-transform: uppercase;
        transition: 0.3s ease;
        margin-bottom: ${({ explanation }) => (explanation? `0` : `0.5rem`)};
      }
    }
  }
  & .buttonField {
    padding-top: 36px;
    max-width: 375px;
    margin: auto;
    > .spinnerWrapper {
      > div {
        margin: auto;
      }
    }
  }
`;

type BacktestProps = {
  t: TFunction,
  backtestId: ?string,
  backtestData: {
    backtest?: BacktestObject,
    startPolling: Function,
    stopPolling: Function,
  },
  startBacktest: Function,
  cancelBacktest: Function,
  setBacktestId: Function,
};

type BacktestState = {
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
  error: ?string,
  isPolling: boolean,
  additionalSettings: boolean,
  daysOfWeek: Array<string>,
};

const dateInputToISO = (date) => {
  return new Date(date).toISOString();
};

const ISOToDateInput = (ISODate) => {
  return ISODate.substring(0, 10);
};

const isNum = (data) => typeof data === "number";

const POLLING_INTERVAL = 3000;

const DAYS_OF_WEEK = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

class Backtest extends Component<
  BacktestProps,
  BacktestState
> {
  props: BacktestProps;
  state: BacktestState;
  _fetchingNextPage: boolean;

  constructor(props: BacktestProps) {
    super(props);
    const backtestParams = this.props.backtestData &&
      this.props.backtestData.backtest &&
      this.props.backtestData.backtest.parameters;
    this.state = {
      ...this._getUpdatedState(backtestParams, true),
      error: null,
      isPolling: false,
    };
  }

  componentDidMount() {
    if (
      this.props.backtestData &&
      this.props.backtestData.backtest &&
      this.props.backtestData.backtest.parameters
    ) {
      this.setState(this._getUpdatedState(this.props.backtestData.backtest.parameters, true));
    }
    if (
      this.props.backtestData &&
      this.props.backtestData.backtest &&
      (
        this.props.backtestData.backtest.status === "inqueue" ||
        this.props.backtestData.backtest.status === "running"
      )
    ) {
      this.setState({isPolling: true});
      this.props.backtestData.startPolling(POLLING_INTERVAL);
    }
  }

  componentDidUpdate(prevProps) {
    if (
      this.props.backtestData &&
      this.props.backtestData.backtest &&
      this.props.backtestData.backtest.parameters &&
      (
        !prevProps.backtestData.backtest ||
        !prevProps.backtestData.backtest.id ||
        prevProps.backtestData.backtest.id !== this.props.backtestData.backtest.id
      )
    ) {
      this.setState(this._getUpdatedState(this.props.backtestData.backtest.parameters, true));
    }
    if (
      this.props.backtestData &&
      this.props.backtestData.backtest &&
      (
        this.props.backtestData.backtest.status === "inqueue" ||
        this.props.backtestData.backtest.status === "running"
      ) &&
      !this.state.isPolling
    ) {
      this.setState({isPolling: true});
      this.props.backtestData.startPolling(POLLING_INTERVAL);
    }
    if (
      this.state.isPolling &&
      (
        !this.props.backtestData ||
        !this.props.backtestData.backtest ||
        (this.props.backtestData.backtest.status !== "inqueue" &&
        this.props.backtestData.backtest.status !== "running")
      )
    ) {
      this.setState({isPolling: false});
      this.props.backtestData.stopPolling();
    }
  }

  render() {
    const { t, backtestData } = this.props;
    const backtest = backtestData && backtestData.backtest;
    const {
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
      additionalSettings,
      daysOfWeek,
      error,
    } = this.state;
    const showResults = backtest && backtest.id && backtest.status === "finished" && backtest.results;
    const showStatus = backtest && backtest.id && !showResults;
    let formattedEquityHistory, endAccount, pnlNotional, pnlPercent, maxEquity, minEquity, maxDrawDownPercent;
    if (showResults && backtest.results && backtest.results.equityHistory) {
      formattedEquityHistory = this._formatEquityCurve(backtest.results.equityHistory);
      endAccount = Math.round(backtest.results.endAccount*100)/100;
      maxEquity = typeof backtest.results.maxEquity === "number" ? Math.round(backtest.results.maxEquity*100)/100 : "-";
      minEquity = typeof backtest.results.minEquity === "number" ? Math.round(backtest.results.minEquity*100)/100 : "-";
      maxDrawDownPercent = typeof backtest.results.maxDrawDown === "number" ? Math.round(backtest.results.maxDrawDown*10000)/100 : "-";
      pnlNotional = Math.round((backtest.results.endAccount-backtest.results.startAccount)*100)/100;
      pnlPercent = Math.round(((backtest.results.endAccount-backtest.results.startAccount)/backtest.results.startAccount)*100);
    }
    return <BacktestFeed>
      <Container>
        <Title>{t("backtest.title")}</Title>
        <Text>
          <p className="centered">{t("backtest.explanation1")}</p>
          <p className="centered">{t("backtest.explanation2")}</p>
        </Text>
        <BacktestConfig>
          <StyledForm onSubmit={this._handleSubmit}>
            <section>
              <div className="toggleContainer">
                <label className="mainLabel">{t("fields.side.label")}</label>
                <Toggle
                  id="backtestSideToggle"
                  labelLeft={t("fields.side.long")}
                  labelRight={t("fields.side.short")}
                  name="side"
                  checked={side === "short"}
                  twoSided={true}
                  onChange={(checked) => {
                    this._handleSelectChange("side", checked? "short" : "long");
                  }}
                />
              </div>
            </section>
            <section>
              <div className="uniqueField">
                <TextField
                  id="backtestPositionSize"
                  label={t("fields.positionSize")}
                  tabIndex="0"
                  type="number"
                  name="positionSize"
                  required="required"
                  className="form-control"
                  error={error === "INVALID_INPUTS-POSITIONSIZE"}
                  placeholder={t("fields.positionSize")}
                  value={positionSize || ""}
                  onChange={this._handleChange}
                />
              </div>
            </section>
            <section>
              <TextField
                id="backtestStartTime"
                label={t("fields.startTime")}
                infoTooltip={t("backtest.startTimeTooltip")}
                tabIndex="0"
                type="date"
                min={ISOToDateInput(config.firstMOVE.openDate)}
                max={endTime || new Date().toISOString().substring(0,10)}
                name="startTime"
                className="form-control"
                error={error === "INVALID_INPUTS-STARTTIME"}
                placeholder={t("fields.startTime")}
                value={startTime || ""}
                onChange={this._handleChange}
              />
              <TextField
                id="backtestEndTime"
                label={t("fields.endTime")}
                infoTooltip={t("backtest.endTimeTooltip")}
                tabIndex="0"
                type="date"
                min={startTime}
                max={new Date().toISOString().substring(0,10)}
                name="endTime"
                className="form-control"
                placeholder={t("fields.endTime")}
                value={endTime || ""}
                onChange={this._handleChange}
              />
            </section>
            <section>
              <TextField
                id="backtestTakeProfit"
                label={t("fields.takeProfit")}
                infoTooltip={t("backtest.takeProfitTooltip")}
                tabIndex="0"
                type="number"
                name="takeProfit"
                className="form-control"
                error={error === "INVALID_INPUTS-TAKEPROFIT"}
                placeholder={t("fields.takeProfit")}
                value={takeProfit || ""}
                onChange={this._handleChange}
              />
              <TextField
                id="backtestStopLoss"
                label={t("fields.stopLoss")}
                infoTooltip={t("backtest.stopLossTooltip")}
                tabIndex="0"
                type="number"
                name="stopLoss"
                className="form-control"
                error={error === "INVALID_INPUTS-STOPLOSS"}
                placeholder={t("fields.stopLoss")}
                value={stopLoss || ""}
                onChange={this._handleChange}
              />
            </section>
            <section>
              <TextField
                id="backtestMakerFee"
                label={t("fields.makerFee")}
                infoTooltip={t("backtest.makerFeeTooltip")}
                tabIndex="0"
                type="number"
                name="makerFee"
                className="form-control"
                error={error === "INVALID_INPUTS-FEE"}
                placeholder={t("fields.makerFee")}
                value={makerFee || ""}
                onChange={this._handleChange}
              />
              <TextField
                id="backtestTakerFee"
                label={t("fields.takerFee")}
                infoTooltip={t("backtest.takerFeeTooltip")}
                tabIndex="0"
                type="number"
                name="takerFee"
                className="form-control"
                error={error === "INVALID_INPUTS-FEE"}
                placeholder={t("fields.takerFee")}
                value={takerFee || ""}
                onChange={this._handleChange}
              />
            </section>
            <section>
              <Select
                id="backtestSelectOpenCandle"
                label={t("fields.openCandle")}
                infoTooltip={t("backtest.openCandleTooltip")}
                name="openCandle"
                className="form-control"
                error={error === "INVALID_INPUTS-OPENCANDLE"}
                placeholder={"00:00 - Future (Open as Future)"}
                value={`${openCandle}`}
                items={[...Array(48).keys()].map((_,i) => {
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
                })}
                onChange={value => {
                  this._handleSelectChange("openCandle", parseInt(value));
                }}
              />
              <TextField
                id="backtestSlippage"
                label={t("fields.slippage")}
                infoTooltip={t("backtest.slippageTooltip")}
                tabIndex="0"
                type="number"
                name="slippage"
                className="form-control"
                error={error === "INVALID_INPUTS-SLIPPAGE"}
                placeholder={t("fields.slippage")}
                value={slippage || ""}
                onChange={this._handleChange}
              />
            </section>
            <section className="additionalSettingsToggle">
              <Toggle
                id="additionalSettingsToggle"
                labelLeft={t("fields.toggleAdditionalSettings")}
                name="additionalSettings"
                checked={additionalSettings}
                twoSided={false}
                onChange={(checked) => {
                  this._handleSelectChange("additionalSettings", checked);
                }}
              />
            </section>
            {additionalSettings &&
              <Fragment>
                <section className="additionalSettingsDaysOfWeek">
                  <Text className="basicText">
                    <h4 className="settingsTitle">{t("backtest.daysOfWeekTraded")}</h4>
                    <p>{t("backtest.daysOfWeekExplanation")}</p>
                  </Text>
                  <CheckboxField
                    items={DAYS_OF_WEEK.map(dayKey => ({
                      id: dayKey,
                      label: t(`common:days.${dayKey}`),
                      value: dayKey,
                    }))}
                    value={daysOfWeek}
                    onChange={(newVal) => this._handleSelectChange("daysOfWeek", newVal)}
                  />
                </section>
              </Fragment>
            }
            {error?
              <ErrorMessage>
                {t(`common:errors.${formatError(error)}`)}
              </ErrorMessage> : null
            }
            <div className="buttonField">
              {this._getButtonField(backtest)}
            </div>
          </StyledForm>
        </BacktestConfig>
        {showStatus && <ChartZone>
          <div className="infoSummary">
            <h3>{t(`backtest.status.${backtest.status}`)}</h3>
          </div>
        </ChartZone>}
        {showResults && <ChartZone>
          <div className="infoSummary">
            <h3>{t("backtest.resultsSummary")}</h3>
            <div className="textLine">
              <span>
                <Trans
                  t={t}
                  i18nKey="backtest.results.numberOfTrades"
                  values={{
                    trades: backtest.results.trades,
                    wins: backtest.results.wins,
                    losses: backtest.results.losses,
                    strikeRate: Math.round(backtest.results.wins/backtest.results.trades*100),
                  }}
                  components={{ b: <strong /> }}
                />
              </span>
            </div>
            <div className="textLine">
              <span>
                <Trans
                  t={t}
                  i18nKey={backtest.results.liquidated?"backtest.results.pnlLiquidated" : "backtest.results.pnl"}
                  values={{
                    startAccount: backtest.results.startAccount,
                    endAccount,
                    pnlNotional,
                    pnlPercent,
                    maxEquity,
                    minEquity,
                    maxDrawDownPercent,
                  }}
                  components={{ b: <strong />, u: <u /> }}
                />
              </span>
            </div>
          </div>
          <div>
            <LineChart
              title={t("backtest.equityChartTitle")}
              dataVersion={backtest.id}
              series={[{
                id: "equityHistory",
                data: formattedEquityHistory,
                name: t("backtest.equityChartLegend"),
              }]}
            />
          </div>
        </ChartZone>}
      </Container>
    </BacktestFeed>;
  }

  _getButtonField: Function = (backtest) => {
    const {t} = this.props;
    if (!backtest || !backtest.id) {
      return <Button
        id="backtestStart"
        onClick={this._startBacktest}
        color={"primary"}
        width="100%"
        type="submit"
        tabIndex="0"
      >
        {t("backtest.startBacktest")}
      </Button>;
    }
    if (backtest.status === "inqueue") {
      return <Button
        id="backtestCancel"
        onClick={this._cancelBacktest}
        color={"warning"}
        width="100%"
        type="submit"
        tabIndex="0"
      >
        {t("backtest.cancelBacktest")}
      </Button>;
    }
    if (backtest.status === "running") {
      return <div className="spinnerWrapper">
        <Spinner size={30}/>
      </div>;
    }
    /*if (
    backtest.status === "finished" ||
    backtest.status === "error" ||
    backtest.status === "canceled") {
*/
    return <Button
      id="backtestStart"
      onClick={this._startBacktest}
      color={"primary"}
      width="100%"
      type="submit"
      tabIndex="0"
    >
      {t("backtest.startBacktest")}
    </Button>;
  }

  _getUpdatedState: Function = (backtestParams, setDefaults) => {
    if (!backtestParams) {
      return {
        startTime: null,
        endTime: null,
        side: "long",
        openCandle: null,
        positionSize: setDefaults? 10 : null,
        takeProfit: null,
        stopLoss: null,
        takerFee: null,
        makerFee: null,
        slippage: null,
        daysOfWeek: [].concat(DAYS_OF_WEEK),
        additionalSettings: false,
      };
    }
    let additionalSettings = false;
    let daysOfWeek;
    if (backtestParams.daysOfWeek) {
      additionalSettings = true;
      daysOfWeek = DAYS_OF_WEEK.filter(dayKey => backtestParams.daysOfWeek[dayKey]);
    } else {
      daysOfWeek = [].concat(DAYS_OF_WEEK);
    }
    return {
      startTime: backtestParams.startTime && ISOToDateInput(backtestParams.startTime) || null,
      endTime: backtestParams.endTime && ISOToDateInput(backtestParams.endTime) || null,
      side: backtestParams.side || "long",
      openCandle: isNum(backtestParams.openCandle)? backtestParams.openCandle : null,
      positionSize: isNum(backtestParams.positionSize) && backtestParams.positionSize.toString() || (setDefaults? 10 : null),
      takeProfit: isNum(backtestParams.takeProfit) && backtestParams.takeProfit.toString() || null,
      stopLoss: isNum(backtestParams.stopLoss) && backtestParams.stopLoss.toString() || null,
      takerFee: isNum(backtestParams.takerFee) && backtestParams.takerFee.toString() || null,
      makerFee: isNum(backtestParams.makerFee) && backtestParams.makerFee.toString() || null,
      slippage: isNum(backtestParams.slippage) && backtestParams.slippage.toString() || null,
      daysOfWeek,
      additionalSettings,
    };
  }

  _handleSelectChange: Function = (target, value) => {
    this.setState({ [target]: value });
  }

  _handleChange: Function = (e) => {
    const target = e.target.name;
    const value = e.target.value;
    this.setState({ [target]: value });
  }

  _handleSubmit: Function = e => {
    e.preventDefault();
  }

  _formatEquityCurve: Function = (equityHistory) => {
    return equityHistory && equityHistory.map(equityPoint => ([
      new Date(equityPoint.date).getTime(),
      equityPoint.equity,
    ]));
  }
  _formatDaysOfWeek: Function = (daysOfWeekRaw) => {
    let daysOfWeek = {
      mon: false,
      tue: false,
      wed: false,
      thu: false,
      fri: false,
      sat: false,
      sun: false,
    };
    daysOfWeekRaw.forEach(dayOfWeek => daysOfWeek[dayOfWeek] = true);
    return daysOfWeek;
  };

  _startBacktest: Function = () => {
    trackEvent({
      category: "backtest",
      action: `start backtest`,
      name: "start a backtest",
    });
    this.setState({error: null});
    const {
      startBacktest,
      setBacktestId,
    } = this.props;
    const {
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
      additionalSettings,
      daysOfWeek,
    } = this.state;
    const daysOfWeekFormatted = additionalSettings && daysOfWeek && daysOfWeek.length !== 7? this._formatDaysOfWeek(daysOfWeek) : null;
    startBacktest(
      startTime? dateInputToISO(startTime) : null,
      endTime? dateInputToISO(endTime) : null,
      side,
      openCandle,
      positionSize? parseFloat(positionSize) : null,
      takeProfit? parseFloat(takeProfit) : null,
      stopLoss? parseFloat(stopLoss) : null,
      takerFee? parseFloat(takerFee) : null,
      makerFee? parseFloat(makerFee) : null,
      slippage? parseFloat(slippage) : null,
      daysOfWeekFormatted,
    )
    .then((res) => {
      if (res && res.data && res.data.backtest && res.data.backtest.start && res.data.backtest.start.id) {
        setBacktestId(res.data.backtest.start.id);
        trackEvent({
          category: "backtest",
          action: `get backtest results`,
          name: "get backtest results",
        });
      }
    })
    .catch((e) => {
      trackEvent({
        category: "backtest",
        action: `get backtest error`,
        name: "get backtest error",
      });
      if (e.graphQLErrors && e.graphQLErrors[0]) {
        this.setState({error: e.graphQLErrors[0].code});
      } else {
        this.setState({error: "UNKNOWN_ERROR"});
      }
    });
  }

  _cancelBacktest: Function = () => {
    trackEvent({
      category: "backtest",
      action: `cancel backtest`,
      name: "cancel a backtest",
    });
    this.setState({error: null});
    const {
      cancelBacktest,
    } = this.props;
    cancelBacktest()
    .catch((e) => {
      if (e.graphQLErrors && e.graphQLErrors[0]) {
        this.setState({error: e.graphQLErrors[0].code});
      } else {
        this.setState({error: "UNKNOWN_ERROR"});
      }
    });
  }
}

const gqlConnectStartBacktestMutation = graphql(startBacktestMutationDocument, {
  props: ({ mutate }) => ({
    startBacktest: (
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
    ) => mutate(startBacktestMutation(
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
    )),
  }),
});

const gqlConnectCancelBacktestMutation = graphql(cancelBacktestMutationDocument, {
  props: ({ mutate, ownProps }) => ({
    cancelBacktest: (
    ) => mutate(cancelBacktestMutation(
      ownProps.backtestId,
    )),
  }),
});

const gqlConnect = graphql(backtestQueryDocument, {
  options: (ownProps) => ({
    ...createBacktestQuery(ownProps.backtestId),
    fetchPolicy: "network-only",
  }),
  name: "backtestData",
  skip: ownProps => !ownProps.backtestId,
});

const reduxConnect = connect(
  state => ({
    backtestId: state.backtest.get("backtestId"),
  }),
  dispatch => ({
    setBacktestId: (id: string) => dispatch(setBacktestId({id})),
  })
);

export default compose(
  withTranslation(["browser"]),
  reduxConnect,
  gqlConnect,
  gqlConnectStartBacktestMutation,
  gqlConnectCancelBacktestMutation,
)(Backtest);
