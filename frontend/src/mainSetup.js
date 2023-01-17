import "core-js";
import "regenerator-runtime/runtime";
import React from "react";
import ReactDOM from "react-dom";
import App from "./components/App";
import { setupAnalytics } from "./analytics";
setupAnalytics();

ReactDOM.render(<App />, document.getElementById("app-root"));
