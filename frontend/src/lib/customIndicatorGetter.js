/* eslint-disable camelcase */
import config from "../config";
import apolloClient from "../client";
import {TVtoHC} from "./timeframeConvert";
import gql from "graphql-tag";

const customIndicatorGetter = function(PineJS) {
  if (!config.showBTCData) {
    return Promise.resolve([]);
  }
  return Promise.resolve([
    {
      name: "Bitcoin (spot)",
      metainfo: {
        _metainfoVersion: 40,
        id: "btcusdstudy@tv-basicstudies-1",
        scriptIdPart: "",
        name: "Bitcoin (spot)",
        description: "Bitcoin (spot)",
        shortDescription: "Bitcoin (spot)",
        is_hidden_study: false,
        is_price_study: false,
        isCustomIndicator: true,
        plots: [
          {
            id: "plot_0",
            type: "ohlc_open",
            target: "plotcandle_0",
          },
          {
            id: "plot_1",
            type: "ohlc_high",
            target: "plotcandle_0",
          },
          {
            id: "plot_2",
            type: "ohlc_low",
            target: "plotcandle_0",
          },
          {
            id: "plot_3",
            type: "ohlc_close",
            target: "plotcandle_0",
          },
          {
            id: "plot_4",
            type: "ohlc_colorer",
            palette: "palette_0",
            target: "plotcandle_0",
          },
        ],
        palettes: {
          palette_0: {
            colors: [
              { name: "Up Color" },
              { name: "Down Color" },
            ],
            valToIndex: {
              "1": 0,
              "-1": 1,
            },
          },
        },
        ohlcPlots: {
          plotcandle_0: {
            title: "Candles",
          },
        },

        defaults: {
          ohlcPlots: {
            plotcandle_0: {
              borderColor: "#000000",
              color: "#26a69a",
              drawBorder: false,
              drawWick: true,
              plottype: "ohlc_candles", // might be "ohlc_bars" for bars
              visible: true,
              wickColor: "#737375",
            },
          },
          palettes: {
            palette_0: {
              colors: [
                { color: "#26a69a" },
                { color: "#ef5350" },
              ],
            },
          },
          precision: 2,
          inputs: {},
        },
        styles: {},
        inputs: [],
      },
      constructor: function() {
        this.init = function(context, inputCallback) {
          this._context = context;
          this._input = inputCallback;
          // const symbol = "BTCUSD";
          // this._context.new_sym(symbol, PineJS.Std.period(this._context), PineJS.Std.period(this._context));
        };

        this.main = function(context, inputCallback) {
          this._context = context;
          this._input = inputCallback;
          this._context.select_sym(0);
          const hasData = !isNaN(PineJS.Std.close(this._context));
          if (hasData) {
            const keyfield = `BTCOHLC:${TVtoHC(PineJS.Std.interval(this._context))}:${Math.round(PineJS.Std.time(this._context)/1000)}`;
            const btcohlc = apolloClient.readFragment({
              id: keyfield, // The value of the to-do item's unique identifier
              fragment: gql`
                fragment tvBTCOHLC on BTCOHLC {
                  open
                  high
                  low
                  close
                }
              `,
            });
            let res;
            if (btcohlc) {
              res = [
                btcohlc.open,
                btcohlc.high,
                btcohlc.low,
                btcohlc.close,
                btcohlc.close >= btcohlc.open? "1" : "-1",
              ];
            } else {
              res = [NaN,NaN,NaN,NaN,"-1"];
            }
            return res;
          } else {
            const res = [NaN,NaN,NaN,NaN,"-1"];
            return res;
          }
        };
      },
    },
  ]);
};

export default customIndicatorGetter;
