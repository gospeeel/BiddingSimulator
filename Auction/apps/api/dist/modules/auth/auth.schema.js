"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageResponseSchema =
  exports.authResponseSchema =
  exports.loginBodySchema =
  exports.registerBodySchema =
  exports.authTokensSchema =
  exports.authUserSchema =
    void 0;
exports.authUserSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    email: { type: "string" },
    name: { type: ["string", "null"] },
    role: { type: "string", enum: ["USER", "ADMIN"] },
    isEmailVerified: { type: "boolean" },
    createdAt: { type: "string" },
    updatedAt: { type: "string" },
  },
  required: [
    "id",
    "email",
    "name",
    "role",
    "isEmailVerified",
    "createdAt",
    "updatedAt",
  ],
};
exports.authTokensSchema = {
  type: "object",
  properties: {
    accessToken: { type: "string" },
  },
  required: ["accessToken"],
};
exports.registerBodySchema = {
  type: "object",
  properties: {
    email: { type: "string", format: "email" },
    password: { type: "string", minLength: 1, maxLength: 128 },
    name: { type: "string", minLength: 1, maxLength: 100 },
  },
  required: ["email", "password"],
  additionalProperties: false,
};
exports.loginBodySchema = {
  type: "object",
  properties: {
    email: { type: "string", format: "email" },
    password: { type: "string", minLength: 1, maxLength: 128 },
  },
  required: ["email", "password"],
  additionalProperties: false,
};
exports.authResponseSchema = {
  type: "object",
  properties: {
    accessToken: { type: "string" },
    user: exports.authUserSchema,
  },
  required: ["accessToken", "user"],
};
exports.messageResponseSchema = {
  type: "object",
  properties: {
    message: { type: "string" },
  },
  required: ["message"],
};
