/* @flow */

import {
  combineReducers,
} from "redux";

import browsingReducer from "./browsing";
import sidebarReducer from "./sidebar";
import settingsReducer from "./settings";
import backtestReducer from "./backtest";

export default combineReducers({
  browsing: browsingReducer,
  sidebar: sidebarReducer,
  settings: settingsReducer,
  backtest: backtestReducer,
});
