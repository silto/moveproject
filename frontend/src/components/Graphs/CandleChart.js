/* @flow */

import React, { Component } from "react";
import { connect } from "react-redux";
import { compose } from "redux";
import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts/highstock";
import CustomTheme, { barTheme } from "./CustomTheme";
import AllIndicators from "highcharts/indicators/indicators-all";
import DragPanes from "highcharts/modules/drag-panes";
import Annotations from "highcharts/modules/annotations-advanced";
import PriceIndicators from "highcharts/modules/price-indicator";
import FullScreen from "highcharts/modules/full-screen";
import StockTools from "highcharts/modules/stock-tools";
import cn from "classnames";


type CandleChartProps = {
  theme: string,
  title: string,
  serie: {
    name: string,
    priceData: Array<Array<Number>>,
    volumeData: Array<Array<Number>>,
    timeframe: string,
  },
  onTimeframeChange?: Function,
  dataVersion?: string,
  originator?: string,
}

type CandleChartState = {
  chartOptions: {
    title: {
      text: string,
      useHTML: boolean,
    },
    series: Array<{
      name: string,
      priceData: Array<Array<Number>>,
      volumeData: Array<Array<Number>>,// [time, vol, up or down (1 or -1)]
      tooltip: {
        valueDecimals: Number,
      },
    }>,
  },
}



class CandleChart extends Component<CandleChartProps> {
  props: CandleChartProps;
  state: CandleChartState;

  constructor(props: CandleChartProps) {
    super(props);
    const barColors = barTheme(props.theme);
    this.state = {
      // To avoid unnecessary update keep all options in the state.
      chartOptions: {
        title: {
          text: props.title,
          useHTML: true,
        },
        xAxis: {
          type: "datetime",
        },
        rangeSelector: {
          selected: 2,
          buttons: [{
            type: "hour",
            count: 4,
            text: "1m",
            dataGrouping: {
              forced: true,
              units: [["minute", [1]]],
            },
            preserveDataGrouping: true,
            events: {
              click: () => {
                if (props.onTimeframeChange) {
                  props.onTimeframeChange("1m");
                }
              },
            },
          }, {
            type: "hour",
            text: "5m",
            count: 12,
            dataGrouping: {
              forced: true,
              units: [["minute", [5]]],
            },
            preserveDataGrouping: true,
            events: {
              click: () => {
                if (props.onTimeframeChange) {
                  props.onTimeframeChange("5m");
                }
              },
            },
          }, {
            type: "hour",
            text: "15m",
            count: 24,
            dataGrouping: {
              forced: true,
              units: [["minute", [15]]],
            },
            preserveDataGrouping: true,
            events: {
              click: () => {
                if (props.onTimeframeChange) {
                  props.onTimeframeChange("15m");
                }
              },
            },
          }, {
            type: "all",
            text: "1h",
            dataGrouping: {
              forced: true,
              units: [["hour", [1]]],
            },
            preserveDataGrouping: true,
            events: {
              click: () => {
                if (props.onTimeframeChange) {
                  props.onTimeframeChange("1h");
                }
              },
            },
          }],
        },
        tooltip: {
          split: true,
        },
        yAxis: [{
          labels: {
            align: "right",
            x: -3,
          },
          height: "72%",
          lineWidth: 2,
          resize: {
            enabled: true,
          },
        }, {
          labels: {
            align: "right",
            x: -3,
          },
          // type: 'logarithmic',
          title: {
            text: "Volume",
          },
          top: "75%",
          height: "25%",
          offset: 0,
          lineWidth: 2,
        }],
        plotOptions: {
          series: {
            turboThreshold: 3000,
          },
        },
        series: [{
          type: "candlestick",
          id: "mainserie",
          name: props.serie.name,
          data: props.serie.priceData,
          tooltip: {
            valueDecimals: 1,
          },
        }, {
          type: "column",
          name: "Volume",
          data: props.serie.volumeData.map(vol => this._formatVolume(vol, barColors)),
          yAxis: 1,
        }],
      },
    };
    this.initialize(props);
  }

  initialize: Function = (props) => {
    CustomTheme(Highcharts, "candleWithVolume", props.theme);
    AllIndicators(Highcharts);
    DragPanes(Highcharts);
    Annotations(Highcharts);
    PriceIndicators(Highcharts);
    FullScreen(Highcharts);
    StockTools(Highcharts);
  }

  afterChartCreated: Function = (highcharts) => {
    this.internalChart = highcharts;
  }

  componentDidUpdate(prevProps) {
    if (prevProps.dataVersion !== this.props.dataVersion) {
      const barColors = barTheme(this.props.theme);
      this.setState({
        chartOptions: {
          title: {
            text: this.props.title,
            useHTML: true,
          },
          series: [{
            type: "candlestick",
            id: "mainserie",
            name: this.props.serie.name,
            data: this.props.serie.priceData,
            tooltip: {
              valueDecimals: 1,
            },
          }, {
            type: "column",
            name: "Volume",
            data: this.props.serie.volumeData.map(vol => this._formatVolume(vol, barColors)),
            yAxis: 1,
          }],
        },
      });
    }
    if (prevProps.theme !== this.props.theme) {
      CustomTheme({
        setOptions: (opts) => this.internalChart.update(opts),
      }, "candleWithVolume", this.props.theme);
      const barColors = barTheme(this.props.theme);
      this.setState({
        chartOptions: {
          series: [{
            type: "candlestick",
            id: "mainserie",
            name: this.props.serie.name,
            data: this.props.serie.priceData,
            tooltip: {
              valueDecimals: 1,
            },
          }, {
            type: "column",
            name: "Volume",
            data: this.props.serie.volumeData.map(vol => this._formatVolume(vol, barColors)),
            yAxis: 1,
          }],
        },
      });
    }
  }

  render() {
    const { chartOptions} = this.state;
    const {originator} = this.props;
    return (
      <HighchartsReact
        highcharts={Highcharts}
        allowChartUpdate={true}
        constructorType={"stockChart"}
        options={chartOptions}
        containerProps={{className: cn(["chartContainer", originator? originator:null])}}
        updateArgs={[true, true, true]}
        callback={this.afterChartCreated}
      />
    );
  }
  _formatVolume: Function = (vol, colors) => ({
    x: vol[0],
    y: vol[1],
    color: vol[2] > 0? colors.up : colors.down,
    borderColor: colors.border,
    borderWidth: 1,
  });
}

const reduxConnect = connect(
  state => ({
    theme: state.settings.get("theme"),
  }),
  dispatch => ({
  })
);

export default compose(
  reduxConnect
)(CandleChart);
