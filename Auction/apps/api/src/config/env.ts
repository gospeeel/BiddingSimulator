import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z
    .string()
    .default("http://localhost:3001,http://172.26.137.136:3001"),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  COOKIE_SECURE: z.coerce.boolean().default(false),
  ADMIN_MASTER_KEY: z.string().min(1).optional(),
});

export type AppEnv = {
  NODE_ENV: "development" | "production" | "test";
  HOST: string;
  PORT: number;
  CORS_ORIGIN: string | string[];
  DATABASE_URL: string;
  JWT_ACCESS_SECRET: string;
  JWT_ACCESS_TTL: string;
  REFRESH_TOKEN_TTL_DAYS: number;
  COOKIE_SECURE: boolean;
  ADMIN_MASTER_KEY?: string;
};

export const getEnv = (): AppEnv => {
  const parsed = envSchema.parse(process.env);

  return {
    ...parsed,
    CORS_ORIGIN: parsed.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
    ADMIN_MASTER_KEY: parsed.ADMIN_MASTER_KEY,
  };
};
