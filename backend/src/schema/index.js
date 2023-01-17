"use strict";
/* @flow */
const { gql } = require("apollo-server-express");

const {
  definitions: queryDefinitions,
  resolvers: queryResolvers,
} = require("./types/RootQuery");

const {
  definitions: moveDefinitions,
  resolvers: moveResolvers,
} = require("./types/Move");

const {
  definitions: ohlcDefinitions,
  resolvers: ohlcResolvers,
} = require("./types/OHLC");

const {
  definitions: tradeDefinitions,
  resolvers: tradeResolvers,
} = require("./types/Trade");

const {
  definitions: btcohlcDefinitions,
  resolvers: btcohlcResolvers,
} = require("./types/BTCOHLC");

const {
  definitions: backtestDefinitions,
  resolvers: backtestResolvers,
} = require("./types/Backtest");

const {
  definitions: userDefinitions,
  resolvers: userResolvers,
} = require("./types/User");

// mutations
const {
  definitions: mutationDefinitions,
  resolvers: mutationResolvers,
} = require("./types/RootMutation");

// scalar types
const {
  definitions: dateTimeDefinitions,
  resolvers: dateTimeResolvers,
} = require("./scalarTypes/DateTime");

// # GraphQL Schema
// Defines the entry point of any GraphQL query or mutation
/*::
import type { DocumentNode } from 'graphql';
*/
// ## Schema Definitions
const definitions/*: Array<DocumentNode>*/  = [
  gql`
# Defines the entry point of any GraphQL query or mutation
schema {
  # Target the Read-only part of the schema: the query
  query: RootQuery
  # Target the Mutable part of the schema: the mutations
  mutation: RootMutation
}
`,
].concat(
  dateTimeDefinitions,
  queryDefinitions,
  mutationDefinitions,
  moveDefinitions,
  ohlcDefinitions,
  tradeDefinitions,
  btcohlcDefinitions,
  backtestDefinitions,
  userDefinitions
);

// ## Schema Resolvers
const resolvers = Object.assign({},
  dateTimeResolvers,
  queryResolvers,
  mutationResolvers,
  moveResolvers,
  ohlcResolvers,
  btcohlcResolvers,
  tradeResolvers,
  backtestResolvers,
  userResolvers
);

// ## Queryable schema
// Use this schema to perform GraphQL queries
exports.default = {
  typeDefs: definitions,
  resolvers: resolvers,
};
