/* @flow */
import { createAction } from "redux-act";
import type { FSA } from "./fsa";

export const toggleSidebar: (() => FSA)&string =
  createAction("TOGGLE_SIDEBAR");

export const openSidebar: (() => FSA)&string =
  createAction("OPEN_SIDEBAR");

export const closeSidebar: (() => FSA)&string =
  createAction("CLOSE_SIDEBAR");
