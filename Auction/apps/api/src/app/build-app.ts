import Fastify from "fastify";

import type { AppEnv } from "../config/env";
import { registerPlugins } from "./register-plugins";
import { registerRoutes } from "./register-routes";

export const buildApp = async (env: AppEnv) => {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "development" ? "info" : "warn",
    },
  });

  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);

    return reply.status(500).send({
      message: "Internal server error",
    });
  });

  await registerPlugins(app, env);
  await registerRoutes(app);

  return app;
};
