
const barTheme = (theme) => ({
  up: "#ffffff",
  down: "#2cb4c9",
  border: theme === "light"? "#333333" : "#ffffff",
});

const bubbleTheme = (theme) => ({
  buy: "#42ab67",
  sell: "#f12838",
  liqBuy: "#42ab67",
  liqSell: "#f12838",
});

const colorPalette = ["#2cb4c9", "#fa3b69", "#2bc77a", "#fed330", "#fa8231", "#a55eea"];

export {barTheme, bubbleTheme, colorPalette};

const theme = (Highcharts, version, theme) => {
  // let colors;
  // if (version === "candleWithVolume") {
  // colors = ["#2196f3", "#f12838", "#44ad67", "#fed330", "#fa8231", "#a55eea"];
  // } else {
  //   colors = ["#2196f3", "#f12838", "#44ad67", "#fed330", "#fa8231", "#a55eea"];
  // }
  const customTheme = {
    "colors": colorPalette,
    "chart": {
      "backgroundColor": theme === "light"? "#ffffff" : "#0A0E17",
      "style": {
        "fontFamily": "'Trebuchet MS', sans-serif",
        "color": theme === "light"? "#666666" : "#bababa",
        plotBorderColor: theme === "light"? "#ccd6eb" : "#bababa",
      },
    },
    "title": {
      "style": {
        "color": theme === "light"? "#333333" : "#bababa",
        textTransform: "uppercase",
        fontSize: "20px",
      },
      "align": "center",
    },
    "subtitle": {
      "style": {
        "color": theme === "light"? "#666666" : "#bababa",
        textTransform: "uppercase",
      },
    },
    "xAxis": {
      "gridLineDashStyle": "Dot",
      "gridLineWidth": 1,
      "gridLineColor": "#707073",
      "lineColor": theme === "light"? "#666666" : "#bababa",
      "minorGridLineColor": "#505053",
      "tickColor": theme === "light"? "#666666" : "#bababa",
      "tickWidth": 1,
      labels: {
        style: {
          color: theme === "light"? "#333333" : "#E0E0E3",
          "font-size": "13px",
        },
      },
    },
    "yAxis": {
      "gridLineDashStyle": "Dot",
      "gridLineColor": "#707073",
      "lineColor": theme === "light"? "#666666" : "#bababa",
      "minorGridLineColor": "#505053",
      "tickColor": theme === "light"? "#666666" : "#bababa",
      "tickWidth": 1,
      labels: {
        style: {
          color: theme === "light"? "#333333" : "#E0E0E3",
          "font-size": "13px",
        },
      },
    },
    tooltip: {
      backgroundColor: theme === "light"? "rgba(247, 247, 247, 0.85)" : "rgba(0, 0, 0, 0.85)",
      style: {
        color: theme === "light"? "#101010" : "#F0F0F0",
      },
    },
    plotOptions: {
      series: {
        dataLabels: {
          color: theme === "light"? "#101013" : "#F0F0F3",
          style: {
            fontSize: "13px",
          },
        },
        marker: {
          lineColor: theme === "light"? "#ccc" : "#333",
        },
      },
      boxplot: {
        fillColor: theme === "light"? "#afafb3" : "#505053",
      },
      candlestick: {
        lineColor: theme === "light"? "#333333" : "white",
        color: "#2cb4c9",
        upColor: "#ffffff",
      },
      errorbar: {
        color: theme === "light"? "#black" : "white",
      },
    },
    legend: {
      backgroundColor: theme === "light"? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)",
      itemStyle: {
        color: theme === "light"? "#333333" : "#E0E0E3",
      },
      itemHoverStyle: {
        color: theme === "light"? "#000" : "#FFF",
      },
      itemHiddenStyle: {
        color: theme === "light"? "#b0b0b3" : "#606063",
      },
      title: {
        style: {
          color: theme === "light"? "#505053" : "#C0C0C0",
        },
      },
    },
    credits: {
      style: {
        color: theme === "light"? "#bababa" : "#666",
      },
    },
    labels: {
      style: {
        color: theme === "light"? "#c9c9d2" : "#707073",
      },
    },
    drilldown: {
      activeAxisLabelStyle: {
        color: theme === "light"? "#101013" : "#F0F0F3",
      },
      activeDataLabelStyle: {
        color: theme === "light"? "#101013" : "#F0F0F3",
      },
    },
    navigation: {
      buttonOptions: {
        symbolStroke: theme === "light"? "#222222" : "#DDDDDD",
        theme: {
          fill: "#505053",
        },
      },
    },
    // scroll charts
    rangeSelector: {
      buttonTheme: {
        fill: theme === "light"? "#f7f7f7" : "#505053",
        stroke: theme === "light"? "#ffffff" : "#000000",
        style: {
          color: theme === "light"? "#333333" : "#CCC",
        },
        states: {
          hover: {
            fill: theme === "light"? "#e6e6e6" : "#707073",
            stroke: theme === "light"? "#ffffff" : "#000000",
            style: {
              color: theme === "light"? "#black" : "white",
            },
          },
          select: {
            fill: theme === "light"? "rgb(230, 235, 245)" : "#000003",
            stroke: theme === "light"? "#ffffff" : "#000000",
            style: {
              color: theme === "light"? "#black" : "white",
            },
          },
        },
      },
      inputBoxBorderColor: theme === "light"? "#afafb3" : "#505053",
      inputStyle: {
        backgroundColor: theme === "light"? "#ccc" : "#333",
        color: theme === "light"? "#666666" : "silver",
      },
      labelStyle: {
        color: theme === "light"? "#666666" : "silver",
      },
    },
    navigator: {
      handles: {
        backgroundColor: theme === "light"? "#f2f2f2" : "#666",
        borderColor: theme === "light"? "#999999" : "#AAA",
      },
      outlineColor: theme === "light"? "#999" : "#CCC",
      maskFill: theme === "light"? "rgba(102,133,194,0.3)" : "rgba(255,255,255,0.1)",
      series: {
        color: "#7798BF",
        lineColor: "#A6C7ED",
      },
      xAxis: {
        gridLineColor: theme === "light"? "#afafb3" : "#505053",
      },
    },
    scrollbar: {
      barBackgroundColor: theme === "light"? "#cccccc" : "#808083",
      barBorderColor: theme === "light"? "#cccccc" : "#808083",
      buttonArrowColor: theme === "light"? "#333" : "#CCC",
      buttonBackgroundColor: theme === "light"? "#e6e6e6" : "#606063",
      buttonBorderColor: theme === "light"? "#cccccc" : "#606063",
      rifleColor: theme === "light"? "#000" : "#FFF",
      trackBackgroundColor: theme === "light"? "#f2f2f2" : "#404043",
      trackBorderColor: theme === "light"? "#f2f2f2" : "#404043",
    },
  };
  Highcharts.setOptions(customTheme);
};

export default theme;
