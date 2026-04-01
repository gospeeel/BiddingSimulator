import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { FastifyInstance } from "fastify";
import Fastify from "fastify";
import type { AppEnv } from "../../../config/env.js";
import { registerPlugins } from "../../../app/register-plugins.js";
import { systemRoutes } from "../system.route.js";

const testEnv: AppEnv = {
  NODE_ENV: "test",
  HOST: "0.0.0.0",
  PORT: 0,
  DATABASE_URL: "postgresql://test:test@localhost:5432/test",
  JWT_ACCESS_SECRET: "test-secret-key-for-testing-min-32-chars!!!",
  JWT_ACCESS_TTL: "15m",
  REFRESH_TOKEN_TTL_DAYS: 30,
  COOKIE_SECURE: false,
  CORS_ORIGIN: ["http://localhost:3001"],
};

let app: FastifyInstance;

beforeEach(async () => {
  app = Fastify({ logger: false });
  app.setErrorHandler((error, _request, reply) => {
    const statusCode =
      typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      typeof error.statusCode === "number"
        ? error.statusCode
        : 500;
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return reply.status(statusCode).send({ message });
  });
  await registerPlugins(app, testEnv);
  await app.register(systemRoutes);
});

afterEach(async () => {
  await app.close();
});

describe("GET /health", () => {
  it("returns 200 with ok status", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as any;
    expect(body.status).toBe("ok");
    expect(body.timestamp).toBeDefined();
    expect(() => new Date(body.timestamp)).not.toThrow();
  });
});
