"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const node_crypto_1 = require("node:crypto");
const argon2_1 = __importDefault(require("argon2"));
const auth_repository_js_1 = require("./auth.repository.js");
const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};
const hashRefreshToken = (token) =>
  (0, node_crypto_1.createHash)("sha256").update(token).digest("hex");
const toSafeUser = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  isEmailVerified: user.isEmailVerified,
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString(),
});
const signAccessToken = async (app, payload, expiresIn) =>
  app.jwt.sign(payload, {
    expiresIn,
  });
const generateRefreshToken = () =>
  (0, node_crypto_1.randomBytes)(48).toString("hex");
exports.authService = {
  async register(app, env, input) {
    const email = input.email.trim().toLowerCase();
    const existingUser =
      await auth_repository_js_1.authRepository.findUserByEmail(email);
    if (existingUser) {
      throw createHttpError(409, "User already exists");
    }
    const passwordHash = await argon2_1.default.hash(input.password, {
      type: argon2_1.default.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });
    const user = await auth_repository_js_1.authRepository.createUser({
      email,
      passwordHash,
      name: input.name?.trim(),
    });
    const accessToken = await signAccessToken(
      app,
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      env.JWT_ACCESS_TTL,
    );
    const refreshToken = generateRefreshToken();
    await auth_repository_js_1.authRepository.createRefreshSession({
      userId: user.id,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: new Date(
        Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
      ),
    });
    return {
      accessToken,
      refreshToken,
      user: toSafeUser(user),
    };
  },
  async login(app, env, input) {
    const email = input.email.trim().toLowerCase();
    const user =
      await auth_repository_js_1.authRepository.findUserByEmail(email);
    if (!user) {
      throw createHttpError(401, "Invalid credentials");
    }
    const isPasswordValid = await argon2_1.default.verify(
      user.passwordHash,
      input.password,
    );
    if (!isPasswordValid) {
      throw createHttpError(401, "Invalid credentials");
    }
    const accessToken = await signAccessToken(
      app,
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      env.JWT_ACCESS_TTL,
    );
    const refreshToken = generateRefreshToken();
    await auth_repository_js_1.authRepository.createRefreshSession({
      userId: user.id,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: new Date(
        Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
      ),
    });
    return {
      accessToken,
      refreshToken,
      user: toSafeUser(user),
    };
  },
  async refresh(app, env, refreshToken) {
    const session =
      await auth_repository_js_1.authRepository.findRefreshSessionByTokenHash(
        hashRefreshToken(refreshToken),
      );
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw createHttpError(401, "Invalid refresh token");
    }
    const accessToken = await signAccessToken(
      app,
      {
        sub: session.user.id,
        email: session.user.email,
        role: session.user.role,
      },
      env.JWT_ACCESS_TTL,
    );
    return {
      accessToken,
      user: toSafeUser(session.user),
    };
  },
  async me(_app, userId) {
    const user = await auth_repository_js_1.authRepository.findUserById(userId);
    if (!user) {
      throw createHttpError(404, "User not found");
    }
    return toSafeUser(user);
  },
};
