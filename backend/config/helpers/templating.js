"use strict";

/**
 * Return config string value based on a path to get it
 * example: "services.google.oauth2.clientId" returns fullObject.services.google.oauth2.clientId value
 */
function getConfigString(path, fullObject) {
  var data = fullObject;
  if(path) {
    path.split('.').forEach(function(property) {
      data = data !== null ? data[property] : null;
    });
  }

  return data ? data : '';
}


/**
 * Parse a string and replace all occurences of <%= path.to.value %>
 * by the config value at path.to.value of the config
 */
function replacePlaceholders(string, fullObject) {
  var regex = /<%=\s?([-\w?\.]+)\s?%>/;
  var m = string.match(regex);

  while (Array.isArray(m) && m.length > 1) {
    string = string.replace(m[0], getConfigString(m[1], fullObject));
    m = string.match(regex);
  }

  return string;
}

/**
 * Walk ALL the object and replace placeholders in string values
 */
module.exports.walkAndReplace = function walkAndReplace(object, fullObject) {
  fullObject = fullObject || object;

  if(object) {
    if(typeof object === 'object') {
      Object.keys(object).forEach(function(key) {
        object[key] = walkAndReplace(object[key], fullObject);
      });
    }
    else if(typeof object === 'string') {
      object = replacePlaceholders(object, fullObject);
    }
  }
  return object;
};
