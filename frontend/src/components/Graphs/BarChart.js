/* @flow */

import React, { Component } from "react";
import { connect } from "react-redux";
import { compose } from "redux";
import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts";
import CustomTheme from "./CustomTheme";
import cn from "classnames";


type BarChartProps = {
  theme: string,
  title: string,
  serie: {
    name: string,
    data: Array<Array<Number>>,
  },
  dataVersion?: string,
  originator?: string,
  isNormalized?: boolean,
}

type BarChartState = {
  chartOptions: {
    title: {
      text: string,
      useHTML: boolean,
    },
    series: Array<{
      name: string,
      data: Array<Array<Number>>,
      tooltip: {
        valueDecimals: Number,
      },
    }>,
  },
}

class BarChart extends Component<BarChartProps> {
  props: BarChartProps;
  state: BarChartState;

  constructor(props: BarChartProps) {
    super(props);

    this.state = {
      chartOptions: {
        chart: {
          type: "column",
        },
        title: {
          text: props.title,
          useHTML: true,
        },
        xAxis: {
          type: "category",
          labels: {
            style: {
              fontSize: "13px",
            },
          },
        },
        yAxis: {
          plotLines: props.isNormalized? [{
            id: "normRef",
            label: "normalization value",
            value: 1,
            width: 3,
          }] : null,
        },
        series: [{
          id: "mainserie",
          name: props.serie.name,
          data: props.serie.data,
          tooltip: {
            valueDecimals: 3,
          },
        }],
      },
    };
    this.initialize(props);
  }

  initialize: Function = (props) => {
    CustomTheme(Highcharts, "bar", props.theme);
  }

  afterChartCreated: Function = (highcharts) => {
    this.internalChart = highcharts;
  }

  componentDidUpdate(prevProps) {
    if (prevProps.dataVersion !== this.props.dataVersion) {
      this.setState({
        chartOptions: {
          chart: {
            type: "column",
          },
          title: {
            text: this.props.title,
            useHTML: true,
          },
          yAxis: prevProps.isNormalized !== this.props.isNormalized? {
            plotLines: this.props.isNormalized? [{
              id: "normRef",
              label: "normalization value",
              value: 1,
              width: 3,
            }] : null,
          } : undefined,
          series: [{
            id: "mainserie",
            name: this.props.serie.name,
            data: this.props.serie.data,
            tooltip: {
              valueDecimals: 3,
            },
          }],
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
        constructorType={"chart"}
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
)(BarChart);
