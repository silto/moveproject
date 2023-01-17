/* @flow */

import React, { Component } from "react";
import { connect } from "react-redux";
import { compose } from "redux";
import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts/highstock";
import CustomTheme, {colorPalette} from "./CustomTheme";
import AllIndicators from "highcharts/indicators/indicators-all";
import DragPanes from "highcharts/modules/drag-panes";
import Annotations from "highcharts/modules/annotations-advanced";
import PriceIndicators from "highcharts/modules/price-indicator";
import FullScreen from "highcharts/modules/full-screen";
import StockTools from "highcharts/modules/stock-tools";
import cn from "classnames";


type LineChartProps = {
  theme: string,
  title: string,
  unit?: string,
  series: Array<{
    id?: string,
    type: string,
    name: string,
    data: Array<Array<Number>>,
    color?: string,
    lineWidth?: number,
  }>,
  btcSerie: Array<Array<Number>>,
  dataVersion?: string,
  originator?: string,
  isNormalized?: boolean,
}

type LineChartState = {
  chartOptions: {
    title: {
      text: string,
      useHTML: boolean,
    },
    series: Array<{
      id?: string,
      name: string,
      data: Array<Array<Number>>,
      color?: string,
      lineWidth?: number,
      tooltip: {
        valueDecimals: Number,
      },
    }>,
    btcSerie: Array<Array<Number>>,
  },
}

class LineChart extends Component<LineChartProps> {
  props: LineChartProps;
  state: LineChartState;

  constructor(props: LineChartProps) {
    super(props);

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
        tooltip: {
          split: true,
        },
        yAxis: props.btcSerie? [{
          id: "mainYAxis",
          plotLines: props.isNormalized? [{
            id: "normRef",
            label: "normalization value",
            value: 1,
            width: 3,
          }] : null,
          labels: {
            format: props.unit? `{value} ${props.unit}` : "{value}",
          },
          height: "72%",
        }, {
          labels: {
            align: "right",
            x: -3,
          },
          // type: 'logarithmic',
          id: "btcYAxis",
          title: {
            text: "Bitcoin",
          },
          top: "75%",
          height: "25%",
          // offset: 0,
          // lineWidth: 2,
        }] : {
          id: "mainYAxis",
          plotLines: props.isNormalized? [{
            id: "normRef",
            label: "normalization value",
            value: 1,
            width: 3,
          }] : null,
          labels: {
            format: props.unit? `{value} ${props.unit}` : "{value}",
          },
          height: "100%",
        },
        legend: {
          enabled: true,
          verticalAlign: "top",
        },
        series: props.series.map((serie, i) => ({
          type: "line",
          id: serie.id || `mainserie_${i}`,
          name: serie.name,
          data: serie.data,
          colorIndex: i,
          lineWidth: serie.lineWidth || 2,
          tooltip: {
            valueDecimals: 2,
          },
          yAxis: "mainYAxis",
        })).concat(props.btcSerie? [{
          type: "candlestick",
          id: "btcserie",
          name: "Bitcoin",
          data: props.btcSerie,
          tooltip: {
            valueDecimals: 1,
          },
          yAxis: "btcYAxis",
          showInLegend: false,
        }] : []),
      },
    };
    this.initialize(props);
  }

  initialize: Function = (props) => {
    CustomTheme(Highcharts, "line", props.theme);
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
    if (prevProps.dataVersion !== this.props.dataVersion || !!prevProps.btcSerie !== !!this.props.btcSerie) {
      this.setState({
        chartOptions: {
          title: {
            text: this.props.title,
            useHTML: true,
          },
          yAxis: (
            prevProps.isNormalized !== this.props.isNormalized ||
            !!prevProps.btcSerie !== !!this.props.btcSerie
          )? (this.props.btcSerie? [{
              id: "mainYAxis",
              plotLines: this.props.isNormalized? [{
                id: "normRef",
                label: "normalization value",
                value: 1,
                width: 3,
              }] : null,
              labels: {
                format: this.props.unit? `{value} ${this.props.unit}` : "{value}",
              },
              height: "72%",
            }, {
              labels: {
                align: "right",
                x: -3,
              },
              // type: 'logarithmic',
              id: "btcYAxis",
              title: {
                text: "Bitcoin",
              },
              top: "75%",
              height: "25%",
              // offset: 0,
              // lineWidth: 2,
            }] : {
              id: "mainYAxis",
              plotLines: this.props.isNormalized? [{
                id: "normRef",
                label: "normalization value",
                value: 1,
                width: 3,
              }] : null,
              labels: {
                format: this.props.unit? `{value} ${this.props.unit}` : "{value}",
              },
              height: "100%",
            }) : undefined,
          series: this.props.series.map((serie, i) => ({
            type: "line",
            id: serie.id || `mainserie_${i}`,
            name: serie.name,
            data: serie.data,
            colorIndex: i,
            lineWidth: serie.lineWidth || 2,
            tooltip: {
              valueDecimals: 2,
            },
            yAxis: "mainYAxis",
          })).concat(this.props.btcSerie? [{
            type: "candlestick",
            id: "btcserie",
            name: "Bitcoin",
            data: this.props.btcSerie,
            tooltip: {
              valueDecimals: 1,
            },
            yAxis: "btcYAxis",
            showInLegend: false,
          }] : []),
        },
      });
    }
    if (prevProps.theme !== this.props.theme) {
      CustomTheme({
        setOptions: (opts) => this.internalChart.update(opts),
      }, "candleWithVolume", this.props.theme);
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
)(LineChart);
