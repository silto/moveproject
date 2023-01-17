/* @flow */
import { createAction } from "redux-act";
import type { FSA } from "./fsa";

export const toggleTheme: (() => FSA)&string =
  createAction("TOGGLE_THEME");

export const setLightTheme: (() => FSA)&string =
  createAction("SET_LIGHT_THEME");

export const setDarkTheme: (() => FSA)&string =
  createAction("SET_DARK_THEME");

export const removeChart: ((payload: {id: string}) => FSA)&string =
  createAction("REMOVE_CHART");

export const saveChart: ((payload: {chartData: any}) => FSA)&string =
  createAction("SAVE_CHART");

export const removeStudyTemplate: ((payload: {name: string}) => FSA)&string =
  createAction("REMOVE_STUDY_TEMPLATE");

export const saveStudyTemplate: ((payload: {studyTemplateData: any}) => FSA)&string =
  createAction("SAVE_STUDY_TEMPLATE");

export const setChartSettingsValue: ((payload: {key: string, value: string}) => FSA)&string =
  createAction("SET_CHART_SETTINGS_VALUE");

export const removeChartSettingsValue: ((payload: {key: string}) => FSA)&string =
  createAction("REMOVE_CHART_SETTINGS_VALUE");
