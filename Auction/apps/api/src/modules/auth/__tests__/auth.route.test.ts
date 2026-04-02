import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import type { FastifyInstance } from "fastify";
import Fastify from "fastify";
import type { AppEnv } from "../../../config/env.js";
import { registerPlugins } from "../../../app/register-plugins.js";
import { authRoutes } from "../auth.route.js";
import { authService } from "../auth.service.js";

vi.mock("../auth.service.js", () => ({
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

describe("POST /auth/register", () => {
  it("returns 201 with valid data", async () => {
    vi.mocked(authService.register).mockResolvedValue({
      user: mockUser,
      refreshToken: "refresh-token-123",
    });

    const response = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: {
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json() as any;
    expect(body.user).toEqual(mockUser);
    expect(body.accessToken).toBeDefined();
    const cookies = response.cookies;
    const refreshCookie = cookies.find((c) => c.name === "refresh_token");
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie?.value).toBe("refresh-token-123");
  });

  it("returns 400 with invalid email", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: {
        email: "not-an-email",
        password: "password123",
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it("returns 400 with missing fields", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: {
        email: "test@example.com",
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it("returns 409 when user already exists", async () => {
    vi.mocked(authService.register).mockRejectedValue(
      Object.assign(new Error("User already exists"), { statusCode: 409 }),
    );

    const response = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: {
        email: "test@example.com",
        password: "password123",
      },
    });

    expect(response.statusCode).toBe(409);
    const body = response.json() as any;
    expect(body.message).toBe("User already exists");
  });
});

describe("POST /auth/login", () => {
  it("returns 200 with valid credentials", async () => {
    vi.mocked(authService.login).mockResolvedValue({
      user: mockUser,
      refreshToken: "refresh-token-123",
    });

    const response = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: "test@example.com",
        password: "password123",
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as any;
    expect(body.user).toEqual(mockUser);
    expect(body.accessToken).toBeDefined();
    const cookies = response.cookies;
    const refreshCookie = cookies.find((c) => c.name === "refresh_token");
    expect(refreshCookie).toBeDefined();
  });

  it("returns 401 with invalid credentials", async () => {
    vi.mocked(authService.login).mockRejectedValue(
      Object.assign(new Error("Invalid credentials"), { statusCode: 401 }),
    );

    const response = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: "test@example.com",
        password: "wrongpassword",
      },
    });

    expect(response.statusCode).toBe(401);
    const body = response.json() as any;
    expect(body.message).toBe("Invalid credentials");
  });

  it("returns 400 with missing fields", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: "test@example.com",
      },
    });

    expect(response.statusCode).toBe(400);
  });
});

describe("POST /auth/refresh", () => {
  it("returns 200 with valid refresh token", async () => {
    vi.mocked(authService.refresh).mockResolvedValue({
      user: mockUser,
      refreshToken: "new-refresh-token",
    });

    const response = await app.inject({
      method: "POST",
      url: "/auth/refresh",
      cookies: {
        refresh_token: "valid-refresh-token",
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as any;
    expect(body.user).toEqual(mockUser);
    expect(body.accessToken).toBeDefined();
    const cookies = response.cookies;
    const refreshCookie = cookies.find((c) => c.name === "refresh_token");
    expect(refreshCookie?.value).toBe("new-refresh-token");
  });

  it("returns 401 without refresh token", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/auth/refresh",
    });

    expect(response.statusCode).toBe(401);
    const body = response.json() as any;
    expect(body.message).toBe("Missing refresh token");
  });

  it("returns 401 with invalid refresh token", async () => {
    vi.mocked(authService.refresh).mockRejectedValue(
      Object.assign(new Error("Invalid refresh token"), { statusCode: 401 }),
    );

    const response = await app.inject({
      method: "POST",
      url: "/auth/refresh",
      cookies: {
        refresh_token: "invalid-token",
      },
    });

    expect(response.statusCode).toBe(401);
    const body = response.json() as any;
    expect(body.message).toBe("Invalid refresh token");
  });
});

describe("POST /auth/logout", () => {
  it("returns 200 and clears cookie", async () => {
    vi.mocked(authService.logout).mockResolvedValue(undefined);

    const response = await app.inject({
      method: "POST",
      url: "/auth/logout",
      cookies: {
        refresh_token: "valid-refresh-token",
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as any;
    expect(body.message).toBe("Logged out");
    const cookies = response.cookies;
    const clearCookie = cookies.find(
      (c) => c.name === "refresh_token" && c.value === "",
    );
    expect(clearCookie).toBeDefined();
  });

  it("returns 200 without refresh token", async () => {
    vi.mocked(authService.logout).mockResolvedValue(undefined);

    const response = await app.inject({
      method: "POST",
      url: "/auth/logout",
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as any;
    expect(body.message).toBe("Logged out");
  });
});

describe("GET /auth/me", () => {
  it("returns 200 with valid JWT", async () => {
    vi.mocked(authService.me).mockResolvedValue(mockUser);

    const token = await app.jwt.sign({
      sub: "user-123",
      email: "test@example.com",
      role: "USER",
    });

    const response = await app.inject({
      method: "GET",
      url: "/auth/me",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as any;
    expect(body).toEqual(mockUser);
  });

  it("returns 401 without JWT", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/auth/me",
    });

    expect(response.statusCode).toBe(401);
  });

  it("returns 401 with invalid JWT", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/auth/me",
      headers: {
        authorization: "Bearer invalid-token",
      },
    });

    expect(response.statusCode).toBe(401);
  });
});
