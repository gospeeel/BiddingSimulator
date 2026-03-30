import { buildApp } from "./app/build-app";
import { getEnv } from "./config/env";

const start = async () => {
  const env = getEnv();
  const app = await buildApp(env);

  try {
    await app.listen({
      host: env.HOST,
      port: env.PORT,
    });

    app.log.info(`API is running at http://${env.HOST}:${env.PORT}`);
  } catch (error) {
    app.log.error(error, "Failed to start server");
    process.exit(1);
  }
};

void start();
