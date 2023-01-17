"use strict";

module.exports = function deepExtend(target, source) {
  for(var prop in source) {
    if(prop in target && typeof(target[prop]) == 'object' && typeof(source[prop]) == 'object') {
      deepExtend(target[prop], source[prop]);
    }
    else if(source[prop] !== undefined) {
      target[prop] = source[prop];
    }
  }
  return target;
};