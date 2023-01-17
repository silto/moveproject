/* @flow */
"use strict";

exports.rematchWithMongoIds = (
  docs/*: Array<Object>*/,
  ids/*:Array<string>*/,
  docIdToMatch/*:: ?:string*/,
  multipleMatches/*:: ?:boolean*/
)/*: Array<?mixed>*/ => {
  return ids.map(id =>
    (multipleMatches?
      (docs.filter(doc => doc && doc[docIdToMatch || "_id"].toString() === id.toString()) ||
      []) :
      (docs.find(doc => doc && doc[docIdToMatch || "_id"].toString() === id.toString()) ||
      null)
    )
  );
};
