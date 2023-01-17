"use strict";

const config = require("./config");
const mailHelpers = require("./src/lib/mail-helpers");
//pre-load all mongoose and connect to mongodb
require("./src/shared/models")(config, { mail: mailHelpers});
const mongooseInit = require("./config/init-conns");

//load requires
const url = require("url");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const graphqlRoutes = require("./src/schema/routes");
const webRoutes = require("./src/web/routes");
const { corsOptions } = require("./src/middlewares");
const bodyParser = require("body-parser");
const passport = require("passport");
const session = require("express-session");
const RedisClient = require("connect-redis")(session);
const redisSessionUtils = require("./src/lib/redisSessionUtils");
const passportSessionUtils = require("./src/lib/passportSessionUtils");
passportSessionUtils.passportEnhance(passport);
passportSessionUtils.passportLoadStrategies(passport);

const redisUrl = url.parse(config.session.url);
const redisCredentials = (redisUrl.auth || "").split(":")[1];
redisSessionUtils.redisEnhance(RedisClient);
redisSessionUtils.sessionEnhance(session.Session);

const redisClient = new RedisClient({
  host: redisUrl.hostname,
  port: redisUrl.port,
  db: 0,
  pass: redisCredentials,
  prefix: config.session.prefix,
  ttl: config.session.ttl,
});

// Emulate a cookie if it was passed as a query parameter
const queryToCookie = function(cookieKey) {
  return function(req, res, next) {
    if (req.query && req.query[cookieKey]) {
      req.cookies[cookieKey] = req.query[cookieKey];
      delete req.query[cookieKey];
    }
    next();
  };
};

module.exports = async () => {
  await mongooseInit();
  const app = module.exports = express();
  app.use(morgan(config.debug? "dev":"combined"));
  app.disable("x-powered-by");
  app.use(bodyParser.urlencoded({extended: true}));
  app.use(queryToCookie(config.cookie.name));
  app.use(session({
    name: config.cookie.name,
    secret: config.session.secret,
    store: redisClient,
    cookie: Object.assign({}, config.cookie),
    resave: false,
    saveUninitialized: false,
    genid: redisSessionUtils.sessionGenId,
  }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(cors(corsOptions));
  // Finally map the api & web server routes
  webRoutes.map(app);
  graphqlRoutes.map(app);
  return app;
};
