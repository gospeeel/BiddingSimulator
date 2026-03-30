export const healthResponseSchema = {
  type: "object",
  properties: {
    status: { type: "string" },
    timestamp: { type: "string" },
  },
  required: ["status", "timestamp"],
} as const;
