import i18n from "i18next";
import Backend from "i18next-xhr-backend";
import moment from "moment";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import config from "../config";
const { debug, supportedLanguages } = config;

window
  .fetch(`${config.API_URL}/graphql`, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: "{me{language}}" }),
  })
  .then(
    res => {
      let resProm = Promise.resolve();
      if (res.status !== 401) {
        resProm = res.json();
      }
      return resProm;
    },
    err => {
      console.error(err);
      return null;
    }
  )
  .then(json => {
    let options = {
      fallbackLng: "en",
      debug: debug,
      defaultNS: "common",
      load: "languageOnly",
      whitelist: supportedLanguages.toLowerCase().split(","),
      ns: ["common"], // add the namespaces that are always needed
      interpolation: {
        format: function(value, format, lng) {
          if (value instanceof Date) {
            return moment(value)
              .locale(lng)
              .format(format);
          }
          return value;
        },
        escapeValue: false, // not needed for react!!
      },
      backend: {
        loadPath: function(/*lngs, namespaces*/) {
          /*
          if (namespaces[0] === "questionnaire") {
            return `${config.API_URL}/locales/{{lng}}/questionnaire`;
          }
          */
          return `/locales/{{lng}}/{{ns}}`;
        },
        crossDomain: true,
      },
      react: {
        wait: true, //do not load trnaslation before component is mounted
      },
      lng: null,
    };
    i18n.use(Backend);
    if (
      !json ||
      !json.data ||
      !json.data.me ||
      !json.data.me.language ||
      json.data.me.language === "auto"
    ) {
      localStorage.removeItem("i18nextLng");
      i18n.use(LanguageDetector);
    } else {
      options.lng = json.data.me.language.toLowerCase();
    }
    if (options.lng) {
      moment.locale(options.lng);
    }
    i18n.use(initReactI18next).init(options);
  });

export default i18n;
