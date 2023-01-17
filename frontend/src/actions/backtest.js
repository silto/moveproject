/* @flow */
import { createAction } from "redux-act";
import type { FSA } from "./fsa";

export const setBacktestId: ((payload: {id: string}) => FSA)&string =
  createAction("SET_BACKTEST_ID");
