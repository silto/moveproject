import config from "../config";

let navMenus = [
  "charts",
  "analytics",
  // "automation",
  // "disclaimer",
];

if (config.showBacktesting) {
  navMenus.push("backtest");
}

export default navMenus;
