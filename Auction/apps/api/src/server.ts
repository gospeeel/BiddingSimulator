import "dotenv/config";
import { buildApp } from "./app/build-app.js";
import { getEnv } from "./config/env.js";

const start = async () => {
  const env = getEnv();
  const app = await buildApp(env);

  try {
    await app.listen({
      host: env.HOST,
      port: env.PORT,
    });

    app.log.info(`Сервер запущен на http://${env.HOST}:${env.PORT}`);
  } catch (error) {
    app.log.error(error, "Ошибка старта сервера");
    process.exit(1);
  }
};

void start();
