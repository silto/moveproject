/* @flow */

const DataLoader = require("dataloader");
const mongoose = require("mongoose");

const {rematchWithMongoIds} = require("./utils");
const { ApolloError } = require("apollo-server-express");

const {
  ObjectId,
} = mongoose.Types;
const User = mongoose.model("User");

const userDataLoader = exports.userDataLoader = new DataLoader(
  (userIds/*: Array<string>*/) => {
    const userIdsClean = userIds.filter(str => mongoose.isValidObjectId(str)).map(str => new ObjectId(str));
    return (userIdsClean.length > 0?
      User.find({
        _id: {$in: userIdsClean},
      })
      .select(User.EXPOSED_FIELDS.join(" "))
      .exec() :
      Promise.resolve()
    )
    .then((docs) => {
      if (!docs || (docs && docs.length === 0)) {
        return Promise.reject(new ApolloError("user not found", "NOT_FOUND"));
      }
      return docs;
    })
    .then(docs => rematchWithMongoIds(docs, userIds));
  },
  {cache: false}
);

module.exports.createUserLoader = (userId/*: string*/)/*:DataLoader<boolean,User>*/ =>
  new DataLoader(
    (queries/*: Array<boolean>*/) => userDataLoader.load(userId).then(user =>
      queries.map(() => user)
    ),
    {cache: false}
  );
