import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import type { FastifyInstance } from "fastify";
import Fastify from "fastify";
import type { AppEnv } from "../../src/config/env.js";
import { registerPlugins } from "../../src/app/register-plugins.js";
import { authRoutes } from "../../src/modules/auth/auth.route.js";
import { authService } from "../../src/modules/auth/auth.service.js";

vi.mock("../../src/modules/auth/auth.service.js", () => ({
  authService: {
    register: vi.fn(),
    login: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
  },
}));

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

const mockUser = {
  id: "user-123",
  email: "test@example.com",
  name: "Test User",
  role: "USER" as const,
  isEmailVerified: false,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

let app: FastifyInstance;

beforeEach(async () => {
  vi.clearAllMocks();
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
  await app.register((authApp) => authRoutes(authApp, testEnv));
});

afterEach(async () => {
  await app.close();
});

describe("Auth flow (smoke)", () => {
  it("completes full auth lifecycle: register -> login -> refresh -> me -> logout", async () => {
    vi.mocked(authService.register).mockResolvedValue({
      user: mockUser,
      refreshToken: "register-refresh-token",
    });
    vi.mocked(authService.login).mockResolvedValue({
      user: mockUser,
      refreshToken: "login-refresh-token",
    });
    vi.mocked(authService.refresh).mockResolvedValue({
      user: mockUser,
      refreshToken: "new-refresh-token",
    });
    vi.mocked(authService.me).mockResolvedValue(mockUser);
    vi.mocked(authService.logout).mockResolvedValue(undefined);

    let cookies: { name: string; value: string }[] = [];

    const registerRes = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: {
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      },
    });
    expect(registerRes.statusCode).toBe(201);
    cookies = registerRes.cookies;
    expect(cookies.find((c) => c.name === "refresh_token")?.value).toBe(
      "register-refresh-token",
    );

    const loginRes = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: "test@example.com",
        password: "password123",
      },
    });
    expect(loginRes.statusCode).toBe(200);
    cookies = loginRes.cookies;
    expect(cookies.find((c) => c.name === "refresh_token")?.value).toBe(
      "login-refresh-token",
    );

    const refreshRes = await app.inject({
      method: "POST",
      url: "/auth/refresh",
      cookies: { refresh_token: "login-refresh-token" },
    });
    expect(refreshRes.statusCode).toBe(200);
    cookies = refreshRes.cookies;
    expect(cookies.find((c) => c.name === "refresh_token")?.value).toBe(
      "new-refresh-token",
    );

    const token = await app.jwt.sign({
      sub: "user-123",
      email: "test@example.com",
      role: "USER",
    });
    const meRes = await app.inject({
      method: "GET",
      url: "/auth/me",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(meRes.statusCode).toBe(200);
    expect(meRes.json()).toEqual(mockUser);

    const logoutRes = await app.inject({
      method: "POST",
      url: "/auth/logout",
      cookies: { refresh_token: "new-refresh-token" },
    });
    expect(logoutRes.statusCode).toBe(200);
    expect((logoutRes.json() as any).message).toBe("Logged out");

    expect(authService.register).toHaveBeenCalledTimes(1);
    expect(authService.login).toHaveBeenCalledTimes(1);
    expect(authService.refresh).toHaveBeenCalledTimes(1);
    expect(authService.me).toHaveBeenCalledTimes(1);
    expect(authService.logout).toHaveBeenCalledTimes(1);
  });
});
