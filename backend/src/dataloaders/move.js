/* @flow */

const DataLoader = require("dataloader");
const mongoose = require("mongoose");
const {rematchWithMongoIds} = require("./utils");
const { ApolloError } = require("apollo-server-express");

const {
  ObjectId,
} = mongoose.Types;
const Move = mongoose.model("Move");

module.exports.createMoveLoader = ()/*: DataLoader<string,Move>*/ => {
  const moveLoader = new DataLoader(
    (moveIds /*: Array<string>*/) => {
      const moveIdsClean = moveIds.filter(str => mongoose.isValidObjectId(str)).map(str => new ObjectId(str));
      return (moveIdsClean.length > 0?
        Move.find({
          _id: {$in: moveIdsClean},
        })
        // .select(Move.PUBLIC_FIELDS.join(" "))
        .lean()
        .exec() :
        Promise.resolve()
      )
      .then((docs) => {
        if (!docs || (docs && docs.length === 0)) {
          return Promise.reject(new ApolloError("move not found", "NOT_FOUND"));
        }
        return docs;
      })
      .then(docs => rematchWithMongoIds(docs, moveIds));
    },
    {cache: true}
  );

  return moveLoader;
};

module.exports.createMoveSymbolLoader = ()/*: DataLoader<string,Move>*/ => {
  const moveLoader = new DataLoader(
    (symbols /*: Array<string>*/) => {
      return Move.find({
        symbol: {$in: symbols},
      })
      // .select(Move.PUBLIC_FIELDS.join(" "))
      .lean()
      .exec()
      .then((docs) => {
        if (!docs || (docs && docs.length === 0)) {
          return Promise.reject(new ApolloError("move not found", "NOT_FOUND"));
        }
        return docs;
      })
      .then(docs => rematchWithMongoIds(docs, symbols, "symbol"));
    },
    {cache: true}
  );

  return moveLoader;
};

/*::
export type MovesForDatesQueryParams = {
  startTime?: Date,
  endTime?: Date,
}
*/

module.exports.createMovesForDatesLoader = ()/*: DataLoader<MovesForDatesQueryParams,Array<OHLC>>*/ => {
  const movesLoader = new DataLoader(
    (queries /*: Array<MovesForDatesQueryParams>*/) => Promise.all(queries.map(({
      startTime,
      endTime,
    }) => {
      let mongoQuery = {
      };
      if ((startTime || endTime)) {
        if (endTime) {
          if (endTime.toString() !== "Invalid Date") {
            mongoQuery.openDate = {$lt: endTime};
          }
        }
        if (startTime) {
          if (startTime.toString() !== "Invalid Date") {
            if (mongoQuery.openDate) {
              (mongoQuery.openDate/*:Object*/).$gte = startTime;
            } else {
              mongoQuery.openDate = {$gte: startTime};
            }
          }
        }
      }
      return Move.find(mongoQuery)
      .sort({"openDate": 1})
      // .limit(50)
      .lean()
      .exec();
    })),
    {cache: true}
  );

  return movesLoader;
};

module.exports.createMoveRefsLoader = ()/*: DataLoader<boolean,Array<{_id: Object, symbol: string}>>*/ => {
  const movesLoader = new DataLoader(
    (queries /*: Array<boolean>*/) =>
      Move.find({})
      .sort({"openDate": -1})
      .select("_id symbol openDuration openAsFutureDate openDate closeDate")
      .lean()
      .exec()
      .then((moverefs) => {
        if (!moverefs || (moverefs && moverefs.length === 0)) {
          return Promise.reject(new ApolloError("moves not found", "NOT_FOUND"));
        }
        return queries.map(() => moverefs);
      }),
    {cache: true}
  );

  return movesLoader;
};
