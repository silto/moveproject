/* @flow */
"use strict";

const { AuthenticationError, ApolloError } = require("apollo-server-express");

/*::
  import type {RootObject, Context, AuthenticatedContext} from "../schema/types/RootQuery"
*/

module.exports.authenticated = (next/*: Function*/) =>
  (root/*: RootObject*/, args/*: Object*/, context/*: Context*/, info/*: Object*/) => {
    if (!context.user) {
      throw new AuthenticationError(`Unauthenticated!`);
    }
    if (
      !context.loaders /*||
      !context.loaders.user*/
    ) { // checks if all user specific loaders are here
      throw new ApolloError(`Unknown authentication error.`);
    }
    const validatedContext/*: AuthenticatedContext*/ = context;
    return next(root, args, validatedContext, info);
  };
