"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const build_app_js_1 = require("./app/build-app.js");
const env_js_1 = require("./config/env.js");
const start = async () => {
  const env = (0, env_js_1.getEnv)();
  const app = await (0, build_app_js_1.buildApp)(env);
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
