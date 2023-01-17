/* @flow */

import {
  createStore,
  applyMiddleware,
  compose,
} from "redux";
import thunkMiddleware from "redux-thunk";

import { persistStore, persistReducer } from "redux-persist";
import immutableTransform from "redux-persist-transform-immutable";
import storage from "redux-persist/lib/storage";

import { Map } from "immutable";

import mainReducer from "./reducers";

type StoreState = any;


const isPlainEnoughObject = function(o) {
  return o !== null && !Array.isArray(o) && typeof o === "object";
};

const autoMergeLevel2Immutable = function(
  inboundState,
  originalState,
  reducedState
) {
  let newState = { ...reducedState };
  // only rehydrate if inboundState exists and is an object
  if (inboundState && typeof inboundState === "object") {
    Object.keys(inboundState).forEach(key => {
      // ignore _persist data
      if (key === "_persist") {
        return;
      }
      // if reducer modifies substate, skip auto rehydration
      if (originalState[key] !== reducedState[key]) {
        return;
      }
      if (isPlainEnoughObject(reducedState[key].toJS())) {
        // if object is plain enough shallow merge the new values (hence "Level2")
        // newState[key] = inboundState[key].merge(newState[key]);
        newState[key] = newState[key].merge(inboundState[key]);
        return;
      }
      // otherwise hard set
      newState[key] = inboundState[key];
    });
  }
  return newState;
};


export function configureStore(initialState: StoreState) {
  const persistConfig = {
    key: "moveproject-redux-state",
    storage,
    whitelist: ["settings", "backtest"],
    transforms: [immutableTransform()],
    stateReconciler: autoMergeLevel2Immutable,
  };

  const persistedReducer = persistReducer(persistConfig, mainReducer);
  const store = createStore(
    persistedReducer,
    initialState,
    compose(
      applyMiddleware(thunkMiddleware),
      window.__REDUX_DEVTOOLS_EXTENSION__ ? window.__REDUX_DEVTOOLS_EXTENSION__({trace: true, traceLimit: 25}) : f => f
    )
  );
  return store;
}

const VALID_PARAMS = {
  page: [
    "charts",
    "analytics",
    "disclaimer",
    "backtest",
  ],
  tab: [
    "expirations",
    "IV",
    "trades",
  ],
};

// let params = {};
// let query = window.location.search;
// query && query.substr(1).split("&").forEach(function(part) {
//   const item = part.split("=");
//   if (VALID_PARAMS.some(param => param === item[0])) {
//     params[item[0]] = decodeURIComponent(item[1]);
//   }
// });
let tmpState = {
  page: "landing",
  tab: "expirations",
};
const urlPath = window.location.pathname;
const pageandtabExtractor = /\/([a-zA-Z0-9]+)(?:\/([a-zA-Z0-9]+))?/;
const regexRes = pageandtabExtractor.exec(urlPath);
if (regexRes && regexRes[1] && VALID_PARAMS.page.some(id => id === regexRes[1])) {
  if (regexRes[1] === "analytics") {
    if (regexRes && regexRes[2] && VALID_PARAMS.tab.some(id => id === regexRes[2])) {
      tmpState.page = regexRes[1];
      tmpState.tab = regexRes[2];
    }
  } else {
    tmpState.page = regexRes[1];
  }
}
console.log(tmpState);
const uri = window.location.toString();
if (uri.indexOf("?") > 0) {
  const cleanUri = uri.substring(0, uri.indexOf("?"));
  window.history.replaceState({}, document.title, cleanUri);
}
const initialState = {
  browsing: Map(tmpState),
  // settings: Map({}),
};
export const store = configureStore(initialState);
export const persistor = persistStore(store);
