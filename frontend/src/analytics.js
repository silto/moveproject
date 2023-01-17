/* @flow */
import config from "./config";
import ReactMatomo from "./lib/matomo";

const analytics = new ReactMatomo({
  url: config.MATOMO_DOMAIN,
  jsurl: config.MATOMO_JS_DOMAIN,
  siteId: 1,
  trackPageViewAtInit: true,
  isLive: config.NODE_ENV === "production",
  debug: config.debug,
  // pathBasename: "app",
});

export const trackNav = (arg) => analytics.trackNav(arg);
export const trackEvent = (arg) => analytics.trackEvent(arg);
export const push = (arg) => analytics.push(arg);

export const setupAnalytics = function() {
  return analytics;
};
