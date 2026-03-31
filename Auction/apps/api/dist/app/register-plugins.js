"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPlugins = void 0;
const cors_1 = __importDefault(require("@fastify/cors"));
const cookie_1 = __importDefault(require("@fastify/cookie"));
const swagger_1 = __importDefault(require("@fastify/swagger"));
const swagger_ui_1 = __importDefault(require("@fastify/swagger-ui"));
const helmet_1 = __importDefault(require("@fastify/helmet"));
const rate_limit_1 = __importDefault(require("@fastify/rate-limit"));
const auth_js_1 = require("../plugins/auth.js");
const jwt_js_1 = require("../plugins/jwt.js");
const registerPlugins = async (app, env) => {
  await app.register(helmet_1.default);
  await app.register(rate_limit_1.default, {
    max: 100,
    timeWindow: "1 minute",
  });
  await app.register(cors_1.default, {
    origin: env.CORS_ORIGIN,
    credentials: true,
  });
  await app.register(cookie_1.default);
  await app.register(jwt_js_1.jwtPlugin, env);
  await app.register(auth_js_1.authPlugin);
  await app.register(swagger_1.default, {
    openapi: {
      info: {
        title: "Auction API",
        version: "0.1.1",
      },
    },
  });
  if (env.NODE_ENV === "development") {
    await app.register(swagger_ui_1.default, {
      routePrefix: "/docs",
    });
  }
};
exports.registerPlugins = registerPlugins;
