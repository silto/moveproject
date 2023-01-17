// @flow
/**
 * Copyright (c) 2017, Dirk-Jan Rutten
 * All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Parses an RFC 3339 compliant date-time-string into a Date.
module.exports.parseDateTime = (dateTime/*: string*/)/*: Date*/ => {
  return new Date(dateTime);
};

// Serializes a Date into an RFC 3339 compliant date-time-string
// in the format YYYY-MM-DDThh:mm:ss.sssZ.
module.exports.serializeDateTime = (dateTime/*: Date*/)/*: string*/ => {
  return dateTime.toISOString();
};

// Serializes an RFC 3339 compliant date-time-string by shifting
// it to UTC.
module.exports.serializeDateTimeString = (dateTime/*: string*/)/*: string*/ => {
  // If already formatted to UTC then return the time string
  if (dateTime.indexOf("Z") !== -1) {
    return dateTime;
  } else {
    // These are time-strings with timezone information,
    // these need to be shifted to UTC.

    // Convert to UTC time string in
    // format YYYY-MM-DDThh:mm:ss.sssZ.
    let dateTimeUTC = (new Date(dateTime)).toISOString();

    // Regex to look for fractional second part in date-time string
    const regexFracSec = /\.\d{1,}/;

    // Retrieve the fractional second part of the time
    // string if it exists.
    const fractionalPart = dateTime.match(regexFracSec);
    if (fractionalPart === null) {
      // The date-time-string has no fractional part,
      // so we remove it from the dateTimeUTC variable.
      dateTimeUTC = dateTimeUTC.replace(regexFracSec, "");
      return dateTimeUTC;
    } else {
      // These are datetime-string with fractional seconds.
      // Make sure that we inject the fractional
      // second part back in. The `dateTimeUTC` variable
      // has millisecond precision, we may want more or less
      // depending on the string that was passed.
      dateTimeUTC = dateTimeUTC.replace(regexFracSec, fractionalPart[0]);
      return dateTimeUTC;
    }
  }
};

// Serializes a Unix timestamp to an RFC 3339 compliant date-time-string
// in the format YYYY-MM-DDThh:mm:ss.sssZ
module.exports.serializeUnixTimestamp = (timestamp/*: number*/)/*: string*/ => {
  return new Date(timestamp * 1000).toISOString();
};
