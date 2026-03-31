"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtPlugin = void 0;
const jwt_1 = __importDefault(require("@fastify/jwt"));
const jwtPlugin = async (app, env) => {
  await app.register(jwt_1.default, {
    secret: env.JWT_ACCESS_SECRET,
  });
};
exports.jwtPlugin = jwtPlugin;
