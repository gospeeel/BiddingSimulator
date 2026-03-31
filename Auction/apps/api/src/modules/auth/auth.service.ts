import { createHash, randomBytes } from "node:crypto";

import argon2 from "argon2";
import type { FastifyInstance } from "fastify";

import type { AppEnv } from "../../config/env.js";
import { authRepository } from "./auth.repository.js";
import type { AuthResult, SafeUser } from "./auth.types.js";

const createHttpError = (statusCode: number, message: string) => {
  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = statusCode;
  return error;
};

const hashRefreshToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

const toSafeUser = (user: {
  id: string;
  email: string;
  name: string | null;
  role: "USER" | "ADMIN";
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}): SafeUser => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  isEmailVerified: user.isEmailVerified,
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString(),
});

const generateRefreshToken = () => randomBytes(48).toString("hex");
const generateSessionFamilyId = () => randomBytes(24).toString("hex");
const getRefreshExpiryDate = (days: number) =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000);

export const authService = {
  async register(
    _app: FastifyInstance,
    env: AppEnv,
    input: { email: string; password: string; name?: string },
  ): Promise<AuthResult> {
    const email = input.email.trim().toLowerCase();
    const existingUser = await authRepository.findUserByEmail(email);

    if (existingUser) {
      throw createHttpError(409, "User already exists");
    }

    const passwordHash = await argon2.hash(input.password, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });

    const user = await authRepository.createUser({
      email,
      passwordHash,
      name: input.name?.trim(),
    });

    const refreshToken = generateRefreshToken();
    const familyId = generateSessionFamilyId();

    await authRepository.createRefreshSession({
      userId: user.id,
      familyId,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: getRefreshExpiryDate(env.REFRESH_TOKEN_TTL_DAYS),
    });

    return {
      refreshToken,
      user: toSafeUser(user),
    };
  },

  async login(
    _app: FastifyInstance,
    env: AppEnv,
    input: { email: string; password: string },
  ): Promise<AuthResult> {
    const email = input.email.trim().toLowerCase();
    const user = await authRepository.findUserByEmail(email);

    if (!user) {
      throw createHttpError(401, "Invalid credentials");
    }

    const isPasswordValid = await argon2.verify(
      user.passwordHash,
      input.password,
    );

    if (!isPasswordValid) {
      throw createHttpError(401, "Invalid credentials");
    }
    const refreshToken = generateRefreshToken();
    const familyId = generateSessionFamilyId();

    await authRepository.createRefreshSession({
      userId: user.id,
      familyId,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: getRefreshExpiryDate(env.REFRESH_TOKEN_TTL_DAYS),
    });

    return {
      refreshToken,
      user: toSafeUser(user),
    };
  },

  async refresh(
    _app: FastifyInstance,
    env: AppEnv,
    refreshToken: string,
  ): Promise<AuthResult> {
    const currentTokenHash = hashRefreshToken(refreshToken);
    const session =
      await authRepository.findRefreshSessionByTokenHash(currentTokenHash);

    if (!session) {
      throw createHttpError(401, "Invalid refresh token");
    }

    if (session.revokedAt) {
      await authRepository.revokeRefreshFamily(session.familyId);
      throw createHttpError(401, "Refresh token reuse detected");
    }

    if (session.expiresAt < new Date()) {
      throw createHttpError(401, "Invalid refresh token");
    }

    const nextRefreshToken = generateRefreshToken();
    const nextTokenHash = hashRefreshToken(nextRefreshToken);

    await authRepository.rotateRefreshSession({
      currentSessionId: session.id,
      nextTokenHash,
      userId: session.user.id,
      familyId: session.familyId,
      expiresAt: getRefreshExpiryDate(env.REFRESH_TOKEN_TTL_DAYS),
    });

    return {
      refreshToken: nextRefreshToken,
      user: toSafeUser(session.user),
    };
  },

  async logout(_app: FastifyInstance, refreshToken?: string) {
    if (!refreshToken) {
      return;
    }

    const session = await authRepository.findRefreshSessionByTokenHash(
      hashRefreshToken(refreshToken),
    );

    if (!session || session.revokedAt) {
      return;
    }

    await authRepository.revokeRefreshSession(session.id);
  },

  async me(_app: FastifyInstance, userId: string) {
    const user = await authRepository.findUserById(userId);

    if (!user) {
      throw createHttpError(404, "User not found");
    }

    return toSafeUser(user);
  },
};
