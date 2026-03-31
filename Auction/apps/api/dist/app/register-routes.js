"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = void 0;
const env_js_1 = require("../config/env.js");
const auth_route_js_1 = require("../modules/auth/auth.route.js");
const system_route_js_1 = require("../modules/system/system.route.js");
const registerRoutes = async (app) => {
  const env = (0, env_js_1.getEnv)();
  await app.register(system_route_js_1.systemRoutes);
  await app.register(async (authApp) =>
    (0, auth_route_js_1.authRoutes)(authApp, env),
  );
};
exports.registerRoutes = registerRoutes;
