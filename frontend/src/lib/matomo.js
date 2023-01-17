
export type MatomoOpts = {
  url: string,
  jsurl?: string,
  siteId: number,
  enableLinkTracking?: boolean,
  trackPageViewAtInit?: boolean,
  pathBasename?: string,
  isLive?: boolean,
  debug?: boolean,
  jsFilename?: string,
  phpFilename?: string,
};

export default class Matomo {
  constructor(opts: MatomoOpts) {
    const options = opts;
    console.log("matomo constructor");
    options.enableLinkTracking = (options.enableLinkTracking !== undefined) ?
      options.enableLinkTracking : true;
    options.trackPageViewAtInit = (options.trackPageViewAtInit !== undefined) ?
      options.trackPageViewAtInit : true;
    options.isLive = (options.isLive !== undefined) ?
      options.isLive : true;
    options.debug = (options.debug !== undefined) ?
      options.debug : false;
    // options.trackDocumentTitle = (options.trackDocumentTitle !== undefined) ?
    //   options.trackDocumentTitle : true;
    options.jsFilename = (options.jsFilename !== undefined) ?
      options.jsFilename : "matomo.js";
    options.phpFilename = (options.phpFilename !== undefined) ?
      options.phpFilename : "matomo.php";

    this.options = options;

    if (this.options.url === undefined || this.options.siteId === undefined) {
      throw new Error("MatomoTracker cannot be initialized! SiteId and url are mandatory.");
    }

    this.initMatomo();
  }

  initMatomo() {
    if (typeof window !== "undefined") {
      let url = this.options.url;
      let jsurl = this.options.jsurl;
      if (url.indexOf("http://") !== -1 || url.indexOf("https://") !== -1) {
        url = `${url}/`;
      } else {
        url = ((document.location.protocol === "https:") ? `https://${url}/` : `http://${url}/`);
      }
      if (jsurl) {
        if (jsurl.indexOf("http://") !== -1 || jsurl.indexOf("https://") !== -1) {
          jsurl = `${url}/`;
        } else {
          jsurl = ((document.location.protocol === "https:") ? `https://${jsurl}/` : `http://${jsurl}/`);
        }
      }
      window._paq = window._paq || []; // eslint-disable-line  no-underscore-dangle
      window._debugMatomo = this.options.debug;

      if (this.options.isLive) {
        // CNIL script (do not prorogate cookies)

        Matomo.push([function() {
          const self = this;
          function getOriginalVisitorCookieTimeout() {
            const now = new Date();
            const nowTs = Math.round(now.getTime() / 1000);
            const visitorInfo = self.getVisitorInfo();
            const createTs = parseInt(visitorInfo[2]);
            const cookieTimeout = 33696000; // 13 mois en secondes
            const originalTimeout = createTs + cookieTimeout - nowTs;
            return originalTimeout;
          }
          this.setVisitorCookieTimeout( getOriginalVisitorCookieTimeout() );
        }]);

        // end CNIL script

        Matomo.push(["setSiteId", this.options.siteId]);
        Matomo.push(["setTrackerUrl", `${url + this.options.phpFilename}`]);
      }


      if (this.options.trackPageViewAtInit) {
        Matomo.push(["trackPageView"]);
      }
      if (this.options.enableLinkTracking) {
        Matomo.push(["enableLinkTracking"]);
      }

      if (this.options.isLive) {
        const scriptElement = document.createElement("script");
        const refElement = document.getElementsByTagName("script")[0];

        scriptElement.type = "text/javascript";
        scriptElement.defer = true;
        scriptElement.async = true;

        let jsFilename = this.options.jsFilename;

        if (jsFilename.indexOf("http://") !== 0 && jsFilename.indexOf("https://") !== 0) {
          jsFilename = (jsurl || url) + jsFilename;
        }

        scriptElement.src = jsFilename;
        refElement.parentNode.insertBefore(scriptElement, refElement);
      }
    }

    return {
      push: this.push,
      trackEvent: this.trackEvent,
      trackNav: this.trackNav,
      // connectToHistory: this.connectToHistory,
      // disconnectFromHistory: this.disconnectFromHistory,
    };
  }

  static push(args) {
    window._paq.push(args); // eslint-disable-line  no-underscore-dangle
    if (window._debugMatomo) {
      console.log("Matomo push (not live)", args);
    }
  }

  // connectToHistory(history) {
  //   const prevLoc = (typeof history.getCurrentLocation === "undefined") ? history.location : history.getCurrentLocation();
  //   this.previousPath = prevLoc.path || (prevLoc.pathname + prevLoc.search).replace(/^\//, "");
  //   this.unlistenFromHistory = history.listen((loc) => {
  //     this.track(loc);
  //   });
  //   return history;
  // }
  // disconnectFromHistory() {
  //   if (this.unlistenFromHistory) {
  //     this.unlistenFromHistory();
  //     return true;
  //   }
  //   return false;
  // }

  trackEvent(event: {category: string, action: string, name?: string, value?: number}) {
    if (typeof window === "undefined") {
      return;
    }
    if (!event.category || !event.action) {
      return;
    }
    const eventObject = ["trackEvent", event.category, event.action];
    if (event.name) {
      eventObject.push(event.name);
    }
    if (event.value && typeof event.value === "number") {
      eventObject.push(event.value);
    }

    Matomo.push(eventObject);
  }

  getBasePath() {
    if (typeof this.options.pathBasename !== "undefined") {
      return `${window.location.origin}/${this.options.pathBasename}/`;
    }
    return `${window.location.origin}/`;
  }

  trackNav(loc: {path: string, title?: string}) {
    if (typeof window === "undefined") {
      return;
    }
    const currentPath = loc.path;

    if (this.previousPath === currentPath) {
      return;
    }
    if (loc.title) {
      Matomo.push(["setDocumentTitle", loc.title]);
    }
    // if (this.options.trackDocumentTitle) {
    //   Matomo.push(["setDocumentTitle", document.title]);
    // }

    if (this.previousPath) {
      Matomo.push(["setReferrerUrl", `${this.getBasePath()}${this.previousPath}`]);
    }
    Matomo.push(["setCustomUrl", `${this.getBasePath()}${currentPath}`]);
    Matomo.push(["trackPageView"]);

    this.previousPath = currentPath;
  }
}
