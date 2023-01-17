
import {
  removeChart,
  saveChart,
  removeStudyTemplate,
  saveStudyTemplate,
  setChartSettingsValue,
  removeChartSettingsValue,
} from "../actions";
import {store} from "../store";

export default {
  initialSettings: store.getState().settings.get("chartSettings").toObject(),
  setValue: (key, value) => store.dispatch(setChartSettingsValue({key, value})),
  removeValue: (key) => store.dispatch(removeChartSettingsValue({key})),

  removeChart: function(id) {
    store.dispatch(removeChart({id}));
    return Promise.resolve();
  },

  saveChart: function(chartData) {
    if (!chartData.id) {
      chartData.id = Math.random().toString();
    }
    chartData.timestamp = new Date().valueOf();
    store.dispatch(saveChart({chartData}));
    return Promise.resolve(chartData.id);
  },

  getChartContent: function(id) {
    const charts = store.getState().settings.get("charts");
    const chart = charts.find(chrt => chrt.id === id);
    if (chart) {
      return Promise.resolve(chart.content);
    }
    console.error("error");
    return Promise.reject();
  },

  getAllStudyTemplates: function() {
    return Promise.resolve(store.getState().settings.get("studyTemplates").toArray());
  },

  removeStudyTemplate: function(studyTemplateData) {
    store.dispatch(removeStudyTemplate({name: studyTemplateData.name}));
    return Promise.resolve();
  },

  saveStudyTemplate: function(studyTemplateData) {
    store.dispatch(saveStudyTemplate({studyTemplateData}));
    return Promise.resolve();
  },

  getStudyTemplateContent: function(studyTemplateData) {
    const studyTemplates = store.getState().settings.get("studyTemplates");
    const studyTemplate = studyTemplates.find(study => study.name === studyTemplateData.name);
    if (studyTemplate) {
      return Promise.resolve(studyTemplate.content);
    }
    console.error("error");
    return Promise.reject();
  },

};
