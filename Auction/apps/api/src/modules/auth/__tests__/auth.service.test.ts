import { vi, describe, it, expect, beforeEach } from "vitest";
import { authService } from "../auth.service.js";
import { authRepository } from "../auth.repository.js";
import argon2 from "argon2";
import type { FastifyInstance } from "fastify";
import type { AppEnv } from "../../../config/env.js";

vi.mock("../auth.repository.js", () => ({
  authRepository: {
    findUserByEmail: vi.fn(),
    findUserById: vi.fn(),
    createUser: vi.fn(),
    createRefreshSession: vi.fn(),
    findRefreshSessionByTokenHash: vi.fn(),
    revokeRefreshSession: vi.fn(),
    revokeRefreshFamily: vi.fn(),
    rotateRefreshSession: vi.fn(),
  },
}));

vi.mock("argon2", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed-password"),
    verify: vi.fn(),
    argon2id: 2,
  },
}));

const mockApp = {} as FastifyInstance;

const mockEnv: AppEnv = {
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
  passwordHash: "hashed",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

describe("authService.register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates user with valid input", async () => {
    vi.mocked(authRepository.findUserByEmail).mockResolvedValue(null);
    vi.mocked(authRepository.createUser).mockResolvedValue(mockUser);
    vi.mocked(authRepository.createRefreshSession).mockResolvedValue({
      id: "session-123",
    });

    const result = await authService.register(mockApp, mockEnv, {
      email: "TEST@Example.com",
      password: "password123",
      name: "Test User",
    });

    expect(authRepository.findUserByEmail).toHaveBeenCalledWith(
      "test@example.com",
    );
    expect(argon2.hash).toHaveBeenCalled();
    expect(authRepository.createUser).toHaveBeenCalledWith({
      email: "test@example.com",
      passwordHash: "hashed-password",
      name: "Test User",
    });
    expect(result.user.email).toBe("test@example.com");
    expect(result.user.name).toBe("Test User");
    expect(result.refreshToken).toBeDefined();
    expect(result.refreshToken.length).toBeGreaterThan(0);
  });

  it("creates user without name", async () => {
    vi.mocked(authRepository.findUserByEmail).mockResolvedValue(null);
    vi.mocked(authRepository.createUser).mockResolvedValue({
      ...mockUser,
      name: null,
    });
    vi.mocked(authRepository.createRefreshSession).mockResolvedValue({
      id: "session-123",
    });

    const result = await authService.register(mockApp, mockEnv, {
      email: "test@example.com",
      password: "password123",
    });

    expect(authRepository.createUser).toHaveBeenCalledWith({
      email: "test@example.com",
      passwordHash: "hashed-password",
      name: undefined,
    });
    expect(result.user.name).toBeNull();
  });

  it("throws 409 when user already exists", async () => {
    vi.mocked(authRepository.findUserByEmail).mockResolvedValue(mockUser);

    await expect(
      authService.register(mockApp, mockEnv, {
        email: "test@example.com",
        password: "password123",
      }),
    ).rejects.toThrow("User already exists");

    await expect(
      authService.register(mockApp, mockEnv, {
        email: "test@example.com",
        password: "password123",
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe("authService.login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs in with valid credentials", async () => {
    vi.mocked(authRepository.findUserByEmail).mockResolvedValue(mockUser);
    vi.mocked(argon2.verify).mockResolvedValue(true);
    vi.mocked(authRepository.createRefreshSession).mockResolvedValue({
      id: "session-123",
    });

    const result = await authService.login(mockApp, mockEnv, {
      email: "TEST@Example.com",
      password: "password123",
    });

    expect(authRepository.findUserByEmail).toHaveBeenCalledWith(
      "test@example.com",
    );
    expect(argon2.verify).toHaveBeenCalledWith("hashed", "password123");
    expect(result.user.email).toBe("test@example.com");
    expect(result.refreshToken).toBeDefined();
  });

  it("throws 401 when user not found", async () => {
    vi.mocked(authRepository.findUserByEmail).mockResolvedValue(null);

    await expect(
      authService.login(mockApp, mockEnv, {
        email: "test@example.com",
        password: "password123",
      }),
    ).rejects.toMatchObject({ statusCode: 401 });

    await expect(
      authService.login(mockApp, mockEnv, {
        email: "test@example.com",
        password: "password123",
      }),
    ).rejects.toThrow("Invalid credentials");
  });

  it("throws 401 when password is invalid", async () => {
    vi.mocked(authRepository.findUserByEmail).mockResolvedValue(mockUser);
    vi.mocked(argon2.verify).mockResolvedValue(false);

    await expect(
      authService.login(mockApp, mockEnv, {
        email: "test@example.com",
        password: "wrongpassword",
      }),
    ).rejects.toMatchObject({ statusCode: 401 });

    await expect(
      authService.login(mockApp, mockEnv, {
        email: "test@example.com",
        password: "wrongpassword",
      }),
    ).rejects.toThrow("Invalid credentials");
  });
});

describe("authService.refresh", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("refreshes token with valid session", async () => {
    const session = {
      ...mockUser,
      id: "session-123",
      familyId: "family-123",
      tokenHash: "old-hash",
      expiresAt: new Date(Date.now() + 86400000),
      revokedAt: null,
      user: mockUser,
    };
    vi.mocked(authRepository.findRefreshSessionByTokenHash).mockResolvedValue(
      session as any,
    );
    vi.mocked(authRepository.rotateRefreshSession).mockResolvedValue({
      id: "new-session",
    });

    const result = await authService.refresh(mockApp, mockEnv, "valid-token");

    expect(authRepository.rotateRefreshSession).toHaveBeenCalled();
    expect(result.user.id).toBe(mockUser.id);
    expect(result.refreshToken).toBeDefined();
    expect(result.refreshToken).not.toBe("valid-token");
  });

  it("throws 401 when session not found", async () => {
    vi.mocked(authRepository.findRefreshSessionByTokenHash).mockResolvedValue(
      null,
    );

    await expect(
      authService.refresh(mockApp, mockEnv, "invalid-token"),
    ).rejects.toMatchObject({ statusCode: 401 });

    await expect(
      authService.refresh(mockApp, mockEnv, "invalid-token"),
    ).rejects.toThrow("Invalid refresh token");
  });

  it("throws 401 when session is revoked (reuse detection)", async () => {
    const session = {
      id: "session-123",
      familyId: "family-123",
      tokenHash: "old-hash",
      expiresAt: new Date(Date.now() + 86400000),
      revokedAt: new Date(),
      user: mockUser,
    };
    vi.mocked(authRepository.findRefreshSessionByTokenHash).mockResolvedValue(
      session as any,
    );

    await expect(
      authService.refresh(mockApp, mockEnv, "reused-token"),
    ).rejects.toThrow("Refresh token reuse detected");

    expect(authRepository.revokeRefreshFamily).toHaveBeenCalledWith(
      "family-123",
    );
  });

  it("throws 401 when session is expired", async () => {
    const session = {
      id: "session-123",
      familyId: "family-123",
      tokenHash: "old-hash",
      expiresAt: new Date(Date.now() - 86400000),
      revokedAt: null,
      user: mockUser,
    };
    vi.mocked(authRepository.findRefreshSessionByTokenHash).mockResolvedValue(
      session as any,
    );

    await expect(
      authService.refresh(mockApp, mockEnv, "expired-token"),
    ).rejects.toMatchObject({ statusCode: 401 });

    await expect(
      authService.refresh(mockApp, mockEnv, "expired-token"),
    ).rejects.toThrow("Invalid refresh token");
  });
});

describe("authService.logout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("revokes session on logout", async () => {
    const session = {
      id: "session-123",
      revokedAt: null,
    };
    vi.mocked(authRepository.findRefreshSessionByTokenHash).mockResolvedValue(
      session as any,
    );

    await authService.logout(mockApp, "valid-token");

    expect(authRepository.revokeRefreshSession).toHaveBeenCalledWith(
      "session-123",
    );
  });

  it("does nothing when no refresh token provided", async () => {
    await authService.logout(mockApp, undefined);

    expect(authRepository.findRefreshSessionByTokenHash).not.toHaveBeenCalled();
  });

  it("does nothing when session already revoked", async () => {
    vi.mocked(authRepository.findRefreshSessionByTokenHash).mockResolvedValue({
      id: "session-123",
      revokedAt: new Date(),
    } as any);

    await authService.logout(mockApp, "revoked-token");

    expect(authRepository.revokeRefreshSession).not.toHaveBeenCalled();
  });

  it("does nothing when session not found", async () => {
    vi.mocked(authRepository.findRefreshSessionByTokenHash).mockResolvedValue(
      null,
    );

    await authService.logout(mockApp, "nonexistent-token");

    expect(authRepository.revokeRefreshSession).not.toHaveBeenCalled();
  });
});

describe("authService.me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns safe user data", async () => {
    vi.mocked(authRepository.findUserById).mockResolvedValue(mockUser);

    const result = await authService.me(mockApp, "user-123");

    expect(result.id).toBe("user-123");
    expect(result.email).toBe("test@example.com");
    expect(result.role).toBe("USER");
    expect(result.createdAt).toBe("2024-01-01T00:00:00.000Z");
    expect(result.updatedAt).toBe("2024-01-01T00:00:00.000Z");
    expect("passwordHash" in result).toBe(false);
  });

  it("throws 404 when user not found", async () => {
    vi.mocked(authRepository.findUserById).mockResolvedValue(null);

    await expect(authService.me(mockApp, "nonexistent")).rejects.toMatchObject({
      statusCode: 404,
    });

    await expect(authService.me(mockApp, "nonexistent")).rejects.toThrow(
      "User not found",
    );
  });
});
