/* @flow */
import { createReducer } from "redux-act";
import {Map} from "immutable";

import {
  toggleSidebar,
  openSidebar,
  closeSidebar,
} from "../actions";

const initialState = Map({
  opened: false,
});

const options = {
  [toggleSidebar]: (state) => state.merge(Map({
    opened: !state.get("opened"),
  })),
  [openSidebar]: (state) => state.merge(Map({
    opened: true,
  })),
  [closeSidebar]: (state) => state.merge(Map({
    opened: false,
  })),
};

export default createReducer(options, initialState);
