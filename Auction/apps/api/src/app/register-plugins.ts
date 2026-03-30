import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";

import type { FastifyInstance } from "fastify";

import type { AppEnv } from "../config/env";

export const registerPlugins = async (
  app: FastifyInstance,
  env: AppEnv,
) => {
  await app.register(helmet);

  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  await app.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: false,
  });

  await app.register(swagger, {
    openapi: {
      info: {
        title: "Auction API",
        version: "0.1.0",
      },
    },
  });

  if (env.NODE_ENV === "development") {
    await app.register(swaggerUi, {
      routePrefix: "/docs",
    });
  }
};
