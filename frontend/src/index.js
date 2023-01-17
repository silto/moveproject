/* @flow */
"use strict";
// import config from "./config";
// import checkLogin from "./lib/checkLoginOutside";
import i18n from "./lib/i18n";

let i18nInit = false;
// let loggedInChecked = false;

const launchApp = function() {
  if (i18nInit/* && loggedInChecked*/) {
    import("./mainSetup.js");
  }
};

i18n.on("initialized", () => {
  i18nInit = true;
  launchApp();
});

// const jumpToLogin = function() {
//   let s = document.location.search;
//   if (s === "") {
//     s = "?state=emailsignup";
//   }
//   window.location.replace(`/login${s}`);
// };
//
// // Detect if logged in
// checkLogin(config.API_URL)
// .then(me => {
//   if (me){
//     if (
//       me.needEmailValidation ||
//       me.needNewEmailValidation ||
//       me.needNewEmailApproval
//     ) {
//       window.location.replace(
//         `/login?state=${
//           (me.needEmailValidation && "needemailvalidation") ||
//           (me.needNewEmailValidation && "neednewemailvalidation") ||
//           (me.needNewEmailApproval && "neednewemailapproval")
//         }&adminId=${
//           me.id
//         }`
//       );
//       return;
//     }
//     loggedInChecked = true;
//     launchApp();
//   } else {
//     jumpToLogin();
//   }
// })
// .catch(() => {
//   jumpToLogin();
// });
