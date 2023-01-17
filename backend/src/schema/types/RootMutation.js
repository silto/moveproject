/* @flow */
// const {authenticated} = require("../../middlewares").graphQLAuth;
const { gql } = require("apollo-server-express");
const {
  definitions: backtestDefinitions,
  resolvers: backtestResolvers,
} = require("../mutations/Backtest");
/*::
import type { DocumentNode } from 'graphql';
*/
// # Root Mutation type
const definitions/*: Array<DocumentNode>*/ = [
  gql`
# The Root type for mutating the GraphQL schema
type RootMutation {
  backtest: BacktestMutations
}
`,
].concat(
  backtestDefinitions
);

const resolvers = {
  RootMutation: {
    backtest: () => backtestResolvers,
  },
};

module.exports = {
  definitions,
  resolvers,
};
