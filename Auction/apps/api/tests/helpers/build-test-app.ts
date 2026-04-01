import { vi } from "vitest";
import Fastify from "fastify";
import type { AppEnv } from "../src/config/env.js";
import { registerPlugins } from "../src/app/register-plugins.js";
import { authRoutes } from "../src/modules/auth/auth.route.js";
import { systemRoutes } from "../src/modules/system/system.route.js";

export const testEnv: AppEnv = {
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

export const buildTestApp = async () => {
  const app = Fastify({ logger: false });

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
  await app.register((authApp) => authRoutes(authApp, testEnv));

  return app;
};

export const resetMocks = () => {
  vi.clearAllMocks();
};

export const mockUser = {
  id: "test-user-id",
  email: "test@example.com",
  name: "Test User",
  role: "USER" as const,
  isEmailVerified: false,
  passwordHash: "hashed-password",
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockRefreshSession = {
  id: "test-session-id",
  userId: "test-user-id",
  familyId: "test-family-id",
  tokenHash: "test-token-hash",
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  revokedAt: null,
  replacedByTokenHash: null,
  lastUsedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};
