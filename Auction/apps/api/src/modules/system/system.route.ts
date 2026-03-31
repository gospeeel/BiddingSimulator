import type { FastifyInstance } from "fastify";

import { healthResponseSchema } from "./system.schema.js";
import { getHealthStatus } from "./system.service.js";

export const systemRoutes = async (app: FastifyInstance) => {
  app.get(
    "/health",
    {
      schema: {
        tags: ["system"],
        summary: "Health check",
        response: {
          200: healthResponseSchema,
        },
      },
    },
    async () => {
      return getHealthStatus();
    },
  );
};
