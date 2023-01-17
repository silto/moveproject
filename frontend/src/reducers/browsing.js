/* @flow */
import { createReducer } from "redux-act";
import {Map} from "immutable";
import { trackNav } from "../analytics";

import {
  browseToLanding,
  browseToCharts,
  browseToAnalytics,
  browseToAutomation,
  browseToDisclaimer,
  browseToBacktest,
  browseToPreviousPage,
  setTab,
} from "../actions";

const initialState = Map({
  previousPage: null,
  page: "landing",
  tab: "expirations",
});

const pagetitles = {
  landing: "Home",
  charts: "Charts",
  analytics: "Analytics",
  automation: "Automation",
  disclaimer: "Disclaimer",
  backtest: "Backtesting",
};

const tabTitles = {
  expirations: "Expirations",
  IV: "IV",
  trades: "Trades",
};

const setHistory = (page, tab) => {
  history.pushState({page, tab},
    `MOVE Project - ${pagetitles[page]}${tab? ` - ${tabTitles[tab]}`: ""}`,
    `${page === "landing"? "/" : `/${page}${tab? `/${tab}`: ""}`}`
  );
};

const options = {
  [browseToLanding]: (state) => {
    setHistory("landing");
    trackNav({
      path: "",
      title: pagetitles.landig,
    });
    return state.merge(Map({
      previousPage: state.get("page"),
      page: "landing",
    }));
  },
  [browseToCharts]: (state) => {
    setHistory("charts");
    trackNav({
      path: "charts",
      title: pagetitles.charts,
    });
    return state.merge(Map({
      previousPage: state.get("page"),
      page: "charts",
    }));
  },
  [browseToAnalytics]: (state) => {
    setHistory("analytics", "expirations");
    trackNav({
      path: "analytics/expirations",
      title: `${pagetitles.analytics} - Expirations`,
    });
    return state.merge(Map({
      previousPage: state.get("page"),
      page: "analytics",
      tab: "expirations",
    }));
  },
  [browseToAutomation]: (state) => {
    setHistory("automation");
    trackNav({
      path: "automation",
      title: pagetitles.automation,
    });
    return state.merge(Map({
      previousPage: state.get("page"),
      page: "automation",
    }));
  },
  [browseToDisclaimer]: (state) => {
    setHistory("disclaimer");
    trackNav({
      path: "disclaimer",
      title: pagetitles.disclaimer,
    });
    return state.merge(Map({
      previousPage: state.get("page"),
      page: "disclaimer",
    }));
  },
  [browseToBacktest]: (state) => {
    setHistory("backtest");
    trackNav({
      path: "backtest",
      title: pagetitles.backtest,
    });
    return state.merge(Map({
      previousPage: state.get("page"),
      page: "backtest",
    }));
  },
  [browseToPreviousPage]: (state) => {
    setHistory(state.get("previousPage") || "charts");
    trackNav({
      path: state.get("previousPage") || "charts",
      title: pagetitles[state.get("previousPage") || "charts"],
    });
    return state.merge(Map({
      previousPage: null,
      page: state.get("previousPage") || "charts",
    }));
  },
  [setTab]: (state, {tab}) => {
    setHistory("analytics", tab);
    trackNav({
      path: `analytics/${tab}`,
      title: `${pagetitles.analytics} - ${tabTitles[tab]}`,
    });
    return state.merge(Map({
      tab: tab,
    }));
  },
};

export default createReducer(options, initialState);
