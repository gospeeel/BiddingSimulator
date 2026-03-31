"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const auth_schema_js_1 = require("./auth.schema.js");
const auth_service_js_1 = require("./auth.service.js");
const REFRESH_COOKIE_NAME = "refresh_token";
const authRoutes = async (app, env) => {
  app.post(
    "/auth/register",
    {
      schema: {
        tags: ["auth"],
        summary: "Register user",
        body: auth_schema_js_1.registerBodySchema,
        response: {
          201: auth_schema_js_1.authResponseSchema,
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
      const body = request.body;
      const result = await auth_service_js_1.authService.register(
        app,
        env,
        body,
      );
      reply.setCookie(REFRESH_COOKIE_NAME, result.refreshToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: env.COOKIE_SECURE,
        path: "/auth",
      });
      return reply.code(201).send({
        accessToken: result.accessToken,
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
        body: auth_schema_js_1.loginBodySchema,
        response: {
          200: auth_schema_js_1.authResponseSchema,
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
      const body = request.body;
      const result = await auth_service_js_1.authService.login(app, env, body);
      reply.setCookie(REFRESH_COOKIE_NAME, result.refreshToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: env.COOKIE_SECURE,
        path: "/auth",
      });
      return {
        accessToken: result.accessToken,
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
          200: auth_schema_js_1.authResponseSchema,
          401: auth_schema_js_1.messageResponseSchema,
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
      const result = await auth_service_js_1.authService.refresh(
        app,
        env,
        refreshToken,
      );
      return {
        accessToken: result.accessToken,
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
          200: auth_schema_js_1.messageResponseSchema,
        },
      },
    },
    async (_request, reply) => {
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
      preHandler: async (request, reply) => {
        await request.jwtVerify();
      },
      schema: {
        tags: ["auth"],
        summary: "Get current user",
        response: {
          200: auth_schema_js_1.authUserSchema,
          401: auth_schema_js_1.messageResponseSchema,
        },
      },
    },
    async (request) => {
      const payload = request.user;
      return auth_service_js_1.authService.me(app, payload.sub);
    },
  );
};
exports.authRoutes = authRoutes;
