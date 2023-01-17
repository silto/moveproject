/* @flow */

import React, { Component } from "react";
import { connect } from "react-redux";
import { compose } from "redux";
import styled from "styled-components";
import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts/highstock";
import HighchartsMore from "highcharts/highcharts-more";
import CustomTheme, { bubbleTheme } from "./CustomTheme";
import AllIndicators from "highcharts/indicators/indicators-all";
import DragPanes from "highcharts/modules/drag-panes";
import Annotations from "highcharts/modules/annotations-advanced";
import PriceIndicators from "highcharts/modules/price-indicator";
import FullScreen from "highcharts/modules/full-screen";
import StockTools from "highcharts/modules/stock-tools";
import cn from "classnames";

const Styler = styled.div`
  .highcharts-figure, .highcharts-data-table table {
      min-width: 310px;
      max-width: 800px;
      margin: 1em auto;
  }

  #container {
      height: 400px;
  }

  .highcharts-tooltip h3 {
      margin: 0.3em 0;
  }

  .highcharts-data-table table {
    font-family: Verdana, sans-serif;
    border-collapse: collapse;
    border: 1px solid #EBEBEB;
    margin: 10px auto;
    text-align: center;
    width: 100%;
    max-width: 500px;
  }
  .highcharts-data-table caption {
      padding: 1em 0;
      font-size: 1.2em;
      color: #555;
  }
  .highcharts-data-table th {
    font-weight: 600;
      padding: 0.5em;
  }
  .highcharts-data-table td, .highcharts-data-table th, .highcharts-data-table caption {
      padding: 0.5em;
  }
  .highcharts-data-table thead tr, .highcharts-data-table tr:nth-child(even) {
      background: #f8f8f8;
  }
  .highcharts-data-table tr:hover {
      background: #f1f7ff;
  }
`;

type BubbleChartProps = {
  theme: string,
  title: string,
  serie: {
    name: string,
    tradesData: {
      buy: Array<Array<number>>,
      sell: Array<Array<number>>,
      liqBuy: Array<Array<number>>,
      liqSell: Array<Array<number>>,
    },
  },
  dataVersion?: string,
  originator?: string,
}

type BubbleChartState = {
  chartOptions: {
    title: {
      text: string,
      useHTML: boolean,
    },
    series: Array<{
      type: string,
      name: string,
      data: Array<Array<number>>,
      tooltip: {
        valueDecimals: Number,
      },
    }>,
  },
}



class BubbleChart extends Component<BubbleChartProps> {
  props: BubbleChartProps;
  state: BubbleChartState;

  constructor(props: BubbleChartProps) {
    super(props);
    const bubbleColors = bubbleTheme(props.theme);
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
        stockTools: {
          gui: {
            enabled: false,
          },
        },
        rangeSelector: {
          selected: 3,
          buttons: [{
            type: "hour",
            count: 1,
            text: "1h",
          }, {
            type: "hour",
            text: "12h",
            count: 12,
          }, {
            type: "hour",
            text: "24h",
            count: 24,
          }, {
            type: "all",
            text: "all",
          }],
        },
        plotOptions: {
          valueDecimals: 4,
        },
        // navigator: {
        //   adaptToUpdatedData: false,
        // },
        legend: {
          enabled: true,
        },
        tooltip: {
          // xDateFormat: "{value:%a %d %b, %H:%%M:%S.%L}",
          useHTML: true,
          headerFormat: `{point.x:%A, %d %b, %H:%M:%S}`,
          pointFormat: "<b>{point.x:%A, %d %b, %H:%M:%S}</b><br/>" +
              "price: ${point.y}<br/>" +
              "size: {point.z}",
          followPointer: true,
        },
        series: [{
          type: "bubble",
          id: "buy",
          name: `buys`,
          data: props.serie.tradesData.buy,
          color: bubbleColors.buy,
        }, {
          type: "bubble",
          id: "sell",
          name: `sells`,
          data: props.serie.tradesData.sell,
          color: bubbleColors.sell,
        }, {
          type: "bubble",
          id: "liqBuy",
          name: `liquidation buys`,
          data: props.serie.tradesData.liqBuy,
          color: bubbleColors.liqBuy,
        }, {
          type: "bubble",
          id: "liqSell",
          name: `liquidation sells`,
          data: props.serie.tradesData.liqSell,
          color: bubbleColors.liqSell,
        }],
      },
    };
    this.initialize(props);
  }

  initialize: Function = (props) => {
    CustomTheme(Highcharts, "bubble", props.theme);
    HighchartsMore(Highcharts);
    DragPanes(Highcharts);
    FullScreen(Highcharts);
  }

  afterChartCreated: Function = (highcharts) => {
    this.internalChart = highcharts;
  }

  componentDidUpdate(prevProps) {
    if (prevProps.dataVersion !== this.props.dataVersion) {
      const bubbleColors = bubbleTheme(this.props.theme);
      this.setState({
        chartOptions: {
          title: {
            text: this.props.title,
            useHTML: true,
          },
          series: [{
            type: "bubble",
            id: "buy",
            name: `buys`,
            data: this.props.serie.tradesData.buy,
            color: bubbleColors.buy,
          }, {
            type: "bubble",
            id: "sell",
            name: `sells`,
            data: this.props.serie.tradesData.sell,
            color: bubbleColors.sell,
          }, {
            type: "bubble",
            id: "liqBuy",
            name: `liquidation buys`,
            data: this.props.serie.tradesData.liqBuy,
            color: bubbleColors.liqBuy,
          }, {
            type: "bubble",
            id: "liqSell",
            name: `liquidation sells`,
            data: this.props.serie.tradesData.liqSell,
            color: bubbleColors.liqSell,
          }],
        },
      });
    }
    if (prevProps.theme !== this.props.theme) {
      CustomTheme({
        setOptions: (opts) => this.internalChart.update(opts),
      }, "bubble", this.props.theme);
    }
  }

  render() {
    const { chartOptions} = this.state;
    const {originator} = this.props;
    return (
      <Styler>
        <HighchartsReact
          highcharts={Highcharts}
          allowChartUpdate={true}
          constructorType={"stockChart"}
          options={chartOptions}
          containerProps={{className: cn(["chartContainer", originator? originator:null])}}
          updateArgs={[true, true, true]}
          callback={this.afterChartCreated}
        />
      </Styler>
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
)(BubbleChart);
