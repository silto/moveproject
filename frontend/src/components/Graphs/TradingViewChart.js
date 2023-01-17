/* @flow */
/* eslint-disable camelcase */
import React, { Component } from "react";
import { connect } from "react-redux";
import { compose } from "redux";
import styled from "styled-components";
import config from "../../config";
import {widget} from "../../tradingview/charting_library/charting_library.js";
import saveLoadAdapter from "../../lib/saveLoadAdapter";
import chartSettingsAdapter from "../../lib/chartSettingsAdapter";
import customIndicatorGetter from "../../lib/customIndicatorGetter";
import {lightTheme, darkTheme} from "../../../theme";
const TVContainer = styled.div`
  margin: 0;
  padding: 0;
`;

type TradingViewChartProps = {
  theme: string,
  containerId?: string,
  symbol: string,
  interval: string,
  timeframe: string,
  datafeed?: {
    onReady: Function,
    searchSymbols: Function,
    resolveSymbol: Function,
    getBars: Function,
    subscribeBars?: Function,
    unsubscribeBars?: Function,
    calculateHistoryDepth?: Function,
  },
  fullscreen: boolean,
  autosize: boolean,
}

type TradingViewChartState = {

}



class TradingViewChart extends Component<TradingViewChartProps> {
  props: TradingViewChartProps;
  state: TradingViewChartState;
  tvWidget = null;
  btcStudyId = null;
  btcToggleButton = null;
  constructor(props: TradingViewChartProps) {
    super(props);
    this.state = {
    };
  }

  componentDidMount() {
    if (!this.props.datafeed) {
      return null;
    }
    const widgetOptions = {
      theme: this.props.theme === "light"? "Light" : "Dark",
      symbol: this.props.symbol,
      interval: this.props.interval,
      timeframe: this.props.timeframe,
      datafeed: {
        onReady: this.props.datafeed.onReady,
        searchSymbols: this.props.datafeed.searchSymbols,
        resolveSymbol: this.props.datafeed.resolveSymbol,
        getBars: this.props.datafeed.getBars,
        subscribeBars: this.props.datafeed.subscribeBars || function() {
          return true;
        },
        unsubscribeBars: this.props.datafeed.unsubscribeBars || function() {
          return true;
        },
        calculateHistoryDepth: this.props.datafeed.calculateHistoryDepth,
      },
      container_id: this.props.containerId,
      library_path: "/charting_library/",
      locale: "en",
      supports_time: false,
      disabled_features: ["volume_force_overlay", "popup_hints"],
      enabled_features: ["study_templates"],
      fullscreen: this.props.fullscreen,
      autosize: this.props.autosize,
      save_load_adapter: saveLoadAdapter,
      settings_adapter: chartSettingsAdapter,
      load_last_chart: true,
      overrides: {
        "mainSeriesProperties.showPriceLine": false,
        "volumePaneSize": "small",
        "paneProperties.background": this.props.theme === "light"? "#ffffff" : "#0A0E17",
      },
      custom_indicators_getter: customIndicatorGetter,
      custom_css_url: `${config.APP_URL}/css/tradingview.css`,
      // studies_overrides: this.props.studiesOverrides,
    };

    const tvWidget = new widget(widgetOptions);
    this.tvWidget = tvWidget;
    tvWidget.headerReady().then(() => {
      this.btcToggleButton = tvWidget.createButton();
      const toggleBTCListener = () => {
        if (!this.btcStudyId) {
          tvWidget.chart().createStudy("Bitcoin (spot)", false, false)
          .then(entityId => {
            this.btcStudyId = entityId;
            this.btcToggleButton.textContent = "Hide Bitcoin price";
            this.btcToggleButton.setAttribute("title", "Hide Bitcoin price");
          });
        } else {
          tvWidget.chart().removeEntity(this.btcStudyId);
          this.btcStudyId = null;
          this.btcToggleButton.textContent = "Show Bitcoin price";
          this.btcToggleButton.setAttribute("title", "Show Bitcoin price");
        }
      };
      this.btcToggleButton.setAttribute("title", "Show Bitcoin price");
      this.btcToggleButton.style.cursor = "pointer";
      this.btcToggleButton.style.color = this.props.theme === "light"? lightTheme.primary : darkTheme.primary;
      this.btcToggleButton.addEventListener("click", toggleBTCListener);
      this.btcToggleButton.textContent = "Show Bitcoin price";
    });
    // tvWidget.onChartReady(() => {
    //
    // });
  }

  componentDidUpdate(prevProps: TradingViewChartProps) {
    if (prevProps.theme !== this.props.theme) {
      this.tvWidget.changeTheme(this.props.theme === "light"? "Light" : "Dark");
      setTimeout(() => this.tvWidget.applyOverrides({
        "paneProperties.background": this.props.theme === "light"? "#ffffff" : "#0A0E17",
      }),500);
    }
  }

  render() {
    const {containerId} = this.props;
    return (
      <TVContainer
        id={containerId}
        className="chartContainer"
      />
    );
  }
}

TradingViewChart.defaultProps = {
  interval: "60",
  timeframe: "2D",
  containerId: "tv_chart_container",
  fullscreen: false,
  autosize: true,
  // studiesOverrides: {},
};

const reduxConnect = connect(
  state => ({
    theme: state.settings.get("theme"),
  }),
  dispatch => ({
  })
);

export default compose(
  reduxConnect
)(TradingViewChart);
