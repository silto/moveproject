/* @flow */
import { createReducer } from "redux-act";
import {Map} from "immutable";

import {
  setBacktestId,
} from "../actions";

const initialState = Map({
  backtestId: null,
});

const options = {
  [setBacktestId]: (state, {id}) => state.merge(Map({
    backtestId: id,
  })),
};

export default createReducer(options, initialState);
