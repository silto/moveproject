"use strict";
/* @flow */
const { gql } = require("apollo-server-express");

const {
  interface: startBacktestInterface,
  definitions: startBacktestDefinitions,
  resolver: startBacktestResolver,
} = require("./start");

const {
  interface: cancelBacktestInterface,
  definitions: cancelBacktestDefinitions,
  resolver: cancelBacktestResolver,
} = require("./cancel");

exports.definitions = [
  gql`
  # Backtest mutations
  type BacktestMutations {
    ${startBacktestInterface}
    ${cancelBacktestInterface}
  }
  `,
].concat(
  startBacktestDefinitions,
  cancelBacktestDefinitions
);

exports.resolvers = {
  start: startBacktestResolver,
  cancel: cancelBacktestResolver,
};
