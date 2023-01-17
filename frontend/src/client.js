/* @flow */

import {
  ApolloClient,
} from "apollo-client";
import i18n from "./lib/i18n";

import { split } from "apollo-link";
import { createHttpLink } from "apollo-link-http";
import { BatchHttpLink } from "apollo-link-batch-http";
import { getMainDefinition } from "apollo-utilities";
import { InMemoryCache, IntrospectionFragmentMatcher, defaultDataIdFromObject } from "apollo-cache-inmemory";
import { createUploadLink } from "apollo-upload-client";

import config from "./config";
import { moveAllTradesLoadedCustomResolver } from "./gqlRequests/queries";
// import { RestLink } from "apollo-link-rest";

const isObject = node => typeof node === "object" && node !== null;

// This function detect if a file is present in the graphql mutation
const hasFiles = (nodes) => {
  return Object.keys(nodes).some((key) => {
    if (!isObject(nodes[key])) {
      return false;
    }

    if (
      (typeof File !== "undefined" && nodes[key] instanceof File) ||
      (typeof Blob !== "undefined" && nodes[key] instanceof Blob)
    ) {
      return true;
    }

    return hasFiles(nodes[key]);
  });
};

export function configureClient(
  graphQLEndpoint: string = `${config.API_URL}${config.graphqlPath}`) {
  const client = new ApolloClient({
    /** Use the correct link for the case:
     * Websocket for subscriptions
     * Uploadlink for uploads mutations
     * Httplink for other queries and mutations
     * RestLink for REST requests
    **/
    link: split(
      ({ variables }) => hasFiles(variables),
      createUploadLink({ uri: graphQLEndpoint, credentials: "include" }),
      split(({query}) => {
        const definition = getMainDefinition(query);
        return definition && definition.name && (definition.name.value.indexOf("SlowQuery") === 0);
      },
      createHttpLink({ uri: graphQLEndpoint, credentials: "include" , headers: {"X-Gql-Lang": i18n.language}}),
      new BatchHttpLink({ uri: graphQLEndpoint, credentials: "include" , headers: {"X-Gql-Lang": i18n.language}}),
      )
    ),
    cache: new InMemoryCache({
      addTypename: true,
      dataIdFromObject: object => {
        switch (object.__typename) {
          case "BTCOHLC": return `BTCOHLC:${object.timeframe}:${object.timestamp}`; // custom id for btc ohlc objects
          default: return defaultDataIdFromObject(object); // fall back to default handling
        }
      },
      fragmentMatcher: new IntrospectionFragmentMatcher({
        introspectionQueryResultData: {
          __schema: {
            types: [
              // { // example
              //   kind: "UNION",
              //   name: "NodeOrTransferNode",
              //   possibleTypes: [{ name: "Node" }, { name: "TransferNode" }],
              // },
            ],
          },
        },
      }),
    }),
    resolvers: {
      Move: {
        allTradesLoaded: moveAllTradesLoadedCustomResolver,
      },
    },
  });
  return client;
}

export default configureClient();
