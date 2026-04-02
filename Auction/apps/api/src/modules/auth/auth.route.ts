import type { FastifyInstance } from "fastify";

import type { AppEnv } from "../../config/env.js";
import {
  authResponseSchema,
  authUserSchema,
  generateKeyBodySchema,
  generateKeyResponseSchema,
  loginBodySchema,
  messageResponseSchema,
  registerBodySchema,
} from "./auth.schema.js";
import { authService } from "./auth.service.js";

const REFRESH_COOKIE_NAME = "refresh_token";
const refreshCookieOptions = (env: AppEnv) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.COOKIE_SECURE,
  path: "/auth",
});

const signAccessToken = async (
  app: FastifyInstance,
  env: AppEnv,
  user: { id: string; email: string; role: "USER" | "ADMIN" },
) => {
  return app.jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    {
      expiresIn: env.JWT_ACCESS_TTL,
    },
  );
};

export const authRoutes = async (app: FastifyInstance, env: AppEnv) => {
  app.post(
    "/auth/admin/generate-key",
    {
      schema: {
        tags: ["auth"],
        summary: "Generate admin invite key",
        body: generateKeyBodySchema,
        response: {
          200: generateKeyResponseSchema,
          401: messageResponseSchema,
          403: messageResponseSchema,
        },
      },
      config: {
        rateLimit: {
          max: 5,
          timeWindow: "1 minute",
        },
      },
    },
    async (request, reply) => {
      const body = request.body as { masterKey?: string };
      let jwtRole: string | undefined;

      try {
        await request.jwtVerify();
        const payload = request.user as { role?: string };
        jwtRole = payload.role;
      } catch {
        // No valid JWT, will check masterKey
      }

      const result = await authService.generateAdminKey(env, {
        jwtRole,
        masterKey: body.masterKey,
      });

      return reply.code(200).send(result);
    },
  );

  app.post(
    "/auth/register",
    {
      schema: {
        tags: ["auth"],
        summary: "Register user",
        body: registerBodySchema,
        response: {
          201: authResponseSchema,
        },
      },
      config: {
        rateLimit: {
          max: 10,
          timeWindow: "1 minute",
        },
      },
    },
    async (request, reply) => {
      const body = request.body as {
        email: string;
        password: string;
        name?: string;
        adminKey?: string;
      };

      const result = await authService.register(app, env, body);
      const accessToken = await signAccessToken(app, env, {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
      });

      reply.setCookie(
        REFRESH_COOKIE_NAME,
        result.refreshToken,
        refreshCookieOptions(env),
      );

      return reply.code(201).send({
        accessToken,
        user: result.user,
      });
    },
  );

  app.post(
    "/auth/login",
    {
      schema: {
        tags: ["auth"],
        summary: "Login user",
        body: loginBodySchema,
        response: {
          200: authResponseSchema,
        },
      },
      config: {
        rateLimit: {
          max: 10,
          timeWindow: "1 minute",
        },
      },
    },
    async (request, reply) => {
      const body = request.body as {
        email: string;
        password: string;
      };

      const result = await authService.login(app, env, body);
      const accessToken = await signAccessToken(app, env, {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
      });

      reply.setCookie(
        REFRESH_COOKIE_NAME,
        result.refreshToken,
        refreshCookieOptions(env),
      );

      return {
        accessToken,
        user: result.user,
      };
    },
  );

  app.post(
    "/auth/refresh",
    {
      schema: {
        tags: ["auth"],
        summary: "Refresh access token",
        response: {
          200: authResponseSchema,
          401: messageResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const refreshToken = request.cookies[REFRESH_COOKIE_NAME];

      if (!refreshToken) {
        return reply.code(401).send({
          message: "Missing refresh token",
        });
      }

      const result = await authService.refresh(app, env, refreshToken);
      const accessToken = await signAccessToken(app, env, {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
      });

      reply.setCookie(
        REFRESH_COOKIE_NAME,
        result.refreshToken,
        refreshCookieOptions(env),
      );

      return {
        accessToken,
        user: result.user,
      };
    },
  );

  app.post(
    "/auth/logout",
    {
      schema: {
        tags: ["auth"],
        summary: "Logout user",
        response: {
          200: messageResponseSchema,
        },
      },
    },
    async (request, reply) => {
      await authService.logout(app, request.cookies[REFRESH_COOKIE_NAME]);

      reply.clearCookie(REFRESH_COOKIE_NAME, {
        path: "/auth",
      });

      return {
        message: "Logged out",
      };
    },
  );

  app.get(
    "/auth/me",
    {
      preHandler: async (request) => {
        await request.jwtVerify();
      },
      schema: {
        tags: ["auth"],
        summary: "Get current user",
        security: [{ bearerAuth: [] }],
        response: {
          200: authUserSchema,
          401: messageResponseSchema,
        },
      },
    },
    async (request) => {
      const payload = request.user as { sub: string };
      return authService.me(app, payload.sub);
    },
  );
};
