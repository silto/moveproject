const { gql } = require("apollo-server-express");

// # User Query type

exports.definitions = [
  gql`

# A User
type User {
  # The unique id of the user
  id: ID!
  # A unique username
  username: String
  # A unique short id
  shortId: String!
  # The user's language (chosen or detected)
  language: String!
  # Joining date
  joined: DateTime!
  # the user's email
  mail: String
  # Returns if the user needs to validate his email
  needEmailValidation: Boolean
  # Returns if the user needs to validate his new email
  needNewEmailValidation: Boolean
}

`,
];
/*::
import type {Context} from "./RootQuery"
import User from "../../shared/models/user"

*/

exports.resolvers = {
  User: {
    id: (user/*: User*/) => user._id.toString(),
    language: (user/*: User*/) => user.language || "auto",
    joined: (user/*: User*/) => user._id.getTimestamp().toISOString(),
    needEmailValidation: (user/*: User*/) => user.needEmailValidation || false,
    needNewEmailValidation: (user/*: User*/) => !!(user.nmail && user.nmail_token) || false,
  },
};
