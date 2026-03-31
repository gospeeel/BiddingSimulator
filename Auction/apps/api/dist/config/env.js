"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnv = void 0;
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
  NODE_ENV: zod_1.z
    .enum(["development", "production", "test"])
    .default("development"),
  HOST: zod_1.z.string().default("0.0.0.0"),
  PORT: zod_1.z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: zod_1.z
    .string()
    .default("http://localhost:3001,http://172.26.137.136:3001"),
  DATABASE_URL: zod_1.z.string().min(1),
  JWT_ACCESS_SECRET: zod_1.z.string().min(32),
  JWT_ACCESS_TTL: zod_1.z.string().default("15m"),
  REFRESH_TOKEN_TTL_DAYS: zod_1.z.coerce.number().int().positive().default(30),
  COOKIE_SECURE: zod_1.z.coerce.boolean().default(false),
});
const getEnv = () => {
  const parsed = envSchema.parse(process.env);
  return {
    ...parsed,
    CORS_ORIGIN: parsed.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
  };
};
exports.getEnv = getEnv;
