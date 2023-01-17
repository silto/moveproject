/* @flow */
import { createReducer } from "redux-act";
import {Map, List} from "immutable";
import { trackEvent } from "../analytics";

import {
  toggleTheme,
  setLightTheme,
  setDarkTheme,
  removeChart,
  saveChart,
  removeStudyTemplate,
  saveStudyTemplate,
  setChartSettingsValue,
  removeChartSettingsValue,
} from "../actions";

const initialState = Map({
  theme: "dark",
  charts: List(),
  studyTemplates: List(),
  chartSettings: Map(),
});

const options = {
  [toggleTheme]: (state) => {
    let newTheme = state.get("theme") === "light"? "dark" : "light";
    trackEvent({
      category: "settings",
      action: `set ${newTheme} theme`,
      name: `set theme`,
    });
    return state.merge(Map({
      theme: newTheme,
    }));
  },
  [setLightTheme]: (state) => {
    trackEvent({
      category: "settings",
      action: `set light theme`,
      name: `set theme`,
    });
    return state.merge(Map({
      theme: "light",
    }));
  },
  [setDarkTheme]: (state) => {
    trackEvent({
      category: "settings",
      action: `set dark theme`,
      name: `set theme`,
    });
    return state.merge(Map({
      theme: "dark",
    }));
  },
  [removeChart]: (state, {id}) => {
    return state.merge(Map({
      charts: state.get("charts").filter(chart => chart.id !== id),
    }));
  },
  [saveChart]: (state, {chartData}) => {
    let charts = state.get("charts");
    charts = charts.filter(chart => chart.id !== chartData.id);
    return state.merge(Map({
      charts: charts.push(chartData),
    }));
  },
  [removeStudyTemplate]: (state, {name}) => {
    return state.merge(Map({
      studyTemplates: state.get("studyTemplates").filter(study => study.name !== name),
    }));
  },
  [saveStudyTemplate]: (state, {studyTemplateData}) => {
    let studyTemplates = state.get("studyTemplates");
    studyTemplates = studyTemplates.filter(study => study.name !== studyTemplateData.name);
    return state.merge(Map({
      studyTemplates: studyTemplates.push(studyTemplateData),
    }));
  },
  [setChartSettingsValue]: (state, {key, value}) => {
    return state.merge(Map({
      chartSettings: state.get("chartSettings").set(key, value),
    }));
  },
  [removeChartSettingsValue]: (state, {key}) => {
    return state.merge(Map({
      chartSettings: state.get("chartSettings").delete(key),
    }));
  },
};

export default createReducer(options, initialState);
