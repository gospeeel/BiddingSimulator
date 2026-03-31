import Fastify from "fastify";

import type { AppEnv } from "../config/env.js";
import { registerPlugins } from "./register-plugins.js";
import { registerRoutes } from "./register-routes.js";

export const buildApp = async (env: AppEnv) => {
  const app = Fastify({
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

  await registerPlugins(app, env);
  await registerRoutes(app);

  return app;
};
