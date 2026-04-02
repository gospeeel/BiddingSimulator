import { vi } from "vitest";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.JWT_ACCESS_SECRET = "test-secret-key-for-testing-min-32-chars!!!";
process.env.JWT_ACCESS_TTL = "15m";
process.env.REFRESH_TOKEN_TTL_DAYS = "30";
process.env.COOKIE_SECURE = "false";
process.env.CORS_ORIGIN = "http://localhost:3001";

vi.mock("../src/db/prisma.js", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    refreshSession: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(async (cb: (tx: any) => Promise<unknown>) => {
      const tx = {
        refreshSession: {
          update: vi.fn(),
          create: vi.fn(),
        },
      };
      return cb(tx);
    }),
  },
}));
