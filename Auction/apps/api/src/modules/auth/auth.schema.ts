export const authUserSchema = {
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
} as const;

export const authTokensSchema = {
  type: "object",
  properties: {
    accessToken: { type: "string" },
  },
  required: ["accessToken"],
} as const;

export const registerBodySchema = {
  type: "object",
  properties: {
    email: { type: "string", format: "email" },
    password: { type: "string", minLength: 1, maxLength: 128 },
    name: { type: "string", minLength: 1, maxLength: 100 },
  },
  required: ["email", "password"],
  additionalProperties: false,
} as const;

export const loginBodySchema = {
  type: "object",
  properties: {
    email: { type: "string", format: "email" },
    password: { type: "string", minLength: 1, maxLength: 128 },
  },
  required: ["email", "password"],
  additionalProperties: false,
} as const;

export const authResponseSchema = {
  type: "object",
  properties: {
    accessToken: { type: "string" },
    user: authUserSchema,
  },
  required: ["accessToken", "user"],
} as const;

export const messageResponseSchema = {
  type: "object",
  properties: {
    message: { type: "string" },
  },
  required: ["message"],
} as const;
