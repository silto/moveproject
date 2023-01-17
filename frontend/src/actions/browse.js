/* @flow */
import { createAction } from "redux-act";
import type { FSA } from "./fsa";

export const browseToLanding: (() => FSA)&string =
  createAction("BROWSE_LANDING");

export const browseToCharts: (() => FSA)&string =
  createAction("BROWSE_CHARTS");

export const browseToAnalytics: (() => FSA)&string =
  createAction("BROWSE_ANALYTICS");

export const browseToAutomation: (() => FSA)&string =
  createAction("BROWSE_AUTOMATION");

export const browseToDisclaimer: (() => FSA)&string =
  createAction("BROWSE_DISCLAIMER");

export const browseToBacktest: (() => FSA)&string =
  createAction("BROWSE_BACKTEST");

export const browseToPreviousPage: (() => FSA)&string =
  createAction("BROWSE_PREVIOUS_PAGE");

export const setTab: ((payload: {tab: string}) => FSA)&string =
  createAction("SET_TAB");
