import type { FastifyInstance } from "fastify";

import { systemRoutes } from "../modules/system/system.route";

export const registerRoutes = async (app: FastifyInstance) => {
  await app.register(systemRoutes);
};
