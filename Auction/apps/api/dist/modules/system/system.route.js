"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemRoutes = void 0;
const system_schema_js_1 = require("./system.schema.js");
const system_service_js_1 = require("./system.service.js");
const systemRoutes = async (app) => {
  app.get(
    "/health",
    {
      schema: {
        tags: ["system"],
        summary: "Health check",
        response: {
          200: system_schema_js_1.healthResponseSchema,
        },
      },
    },
    async () => {
      return (0, system_service_js_1.getHealthStatus)();
    },
  );
};
exports.systemRoutes = systemRoutes;
