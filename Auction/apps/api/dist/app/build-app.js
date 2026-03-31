"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildApp = void 0;
const fastify_1 = __importDefault(require("fastify"));
const register_plugins_js_1 = require("./register-plugins.js");
const register_routes_js_1 = require("./register-routes.js");
const buildApp = async (env) => {
  const app = (0, fastify_1.default)({
    logger: {
      level: env.NODE_ENV === "development" ? "info" : "warn",
    },
  });
  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);
    const statusCode =
      typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      typeof error.statusCode === "number"
        ? error.statusCode
        : 500;
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return reply.status(statusCode).send({
      message,
    });
  });
  await (0, register_plugins_js_1.registerPlugins)(app, env);
  await (0, register_routes_js_1.registerRoutes)(app);
  return app;
};
exports.buildApp = buildApp;
