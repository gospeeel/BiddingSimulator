import type { FastifyInstance } from "fastify";

import { getEnv } from "../config/env.js";
import { authRoutes } from "../modules/auth/auth.route.js";
import { systemRoutes } from "../modules/system/system.route.js";

export const registerRoutes = async (app: FastifyInstance) => {
  const env = getEnv();

  await app.register(systemRoutes);
  await app.register((authApp) => authRoutes(authApp, env));
};
