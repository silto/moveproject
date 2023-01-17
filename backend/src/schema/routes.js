/* @flow */

const { ApolloServer } = require("apollo-server-express");
const config = require("../../config");
const {userLoadersLoader} = require("../dataloaders");
const forceHttps = require("../middlewares").forceHttps;

const {
  default: graphQLSchema,
} = require("./index");

module.exports.map = (app/*: any*/) => {
  // GraphQL API routing
  const context = ({ req, res }) => {
    const hasUser = !!req.user;
    return userLoadersLoader.load(hasUser? req.user._id.toString() : false)
    .then(loaders => {
      const lang = req.headers["x-gql-lang"]?
        req.headers["x-gql-lang"].substr(0,2) :
        (hasUser && req.user.language?
          req.user.language :
          config.defaultLanguage
        );
      return {
        user: hasUser? req.user : null,
        loaders,
        session: req.session,
        req,
        res,
        language: lang,
      };
    });
  };
  const apolloEndpoint = new ApolloServer({
    typeDefs: graphQLSchema.typeDefs,
    resolvers: graphQLSchema.resolvers,
    context,
    rootValue: {},
    debug: config.debug,
    playground: (config.debug || config.playgroundInProduction)? {
      settings: {
        "request.credentials": "include",
      },
    } : false,
    introspection: config.debug || config.playgroundInProduction,
    formatError: ({message, originalError, extensions}/*: any*/) => {
      if (config.logs) {
        if (extensions && extensions.code === "UNAUTHENTICATED") {
          console.info("––– Unauthenticated –––");
        } else {
          console.error(`GraphQL execution error: [${extensions && extensions.code}] - ${message}
  ${originalError && originalError.stack}`);
        }
      }
      return {
        code: (extensions && extensions.code) || "UNKNOWN_ERROR",
        message: config.debug ? message : undefined,
        stack: config.debug && originalError ? originalError.stack : undefined,
      };
    },
  });
  app.use(config.graphqlPath, forceHttps);
  apolloEndpoint.applyMiddleware({ app, path: config.graphqlPath, cors: false, disableHealthCheck: true });
};
