"use strict";

const createDOMPurify = require("dompurify");
const { JSDOM } = require("jsdom");

const window = (new JSDOM("")).window;
const DOMPurify = createDOMPurify(window);

const purifyConfig = {
  ALLOWED_TAGS: [],
  KEEP_CONTENT: false,
  RETURN_DOM: false,
};

module.exports = function(dirty) {
  return DOMPurify.sanitize(dirty, purifyConfig);
};
