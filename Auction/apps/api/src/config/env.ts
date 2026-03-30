export type AppEnv = {
  NODE_ENV: "development" | "production" | "test";
  HOST: string;
  PORT: number;
  CORS_ORIGIN: string | string[];
};

export const getEnv = (): AppEnv => {
  const nodeEnv = (process.env.NODE_ENV ?? "development") as AppEnv["NODE_ENV"];
  const port = Number(process.env.PORT ?? 4000);

  if (Number.isNaN(port)) {
    throw new Error("PORT must be a valid number");
  }

  return {
    NODE_ENV: nodeEnv,
    HOST: process.env.HOST ?? "0.0.0.0",
    PORT: port,
    CORS_ORIGIN: process.env.CORS_ORIGIN?.split(",") ?? [
      "http://localhost:3001",
      "http://172.26.137.136:3001",
    ],
  };
};
