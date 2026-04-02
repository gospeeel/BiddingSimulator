export type DbUser = {
  id: string;
  email: string;
  passwordHash: string;
  name: string | null;
  role: "USER" | "ADMIN";
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type DbRefreshSession = {
  id: string;
  userId: string;
  familyId: string;
  tokenHash: string;
  replacedByTokenHash: string | null;
  expiresAt: Date;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user: DbUser;
};

export type DbAdminInviteKey = {
  id: string;
  key: string;
  used: boolean;
  usedBy: string | null;
  createdAt: Date;
  usedAt: Date | null;
};

export const dbUser = (overrides: Partial<DbUser> = {}): DbUser => ({
  id: "user-123",
  email: "test@example.com",
  name: "Test User",
  role: "USER",
  isEmailVerified: false,
  passwordHash: "hashed",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  ...overrides,
});

export const dbRefreshSession = (
  overrides: Partial<DbRefreshSession> = {},
): DbRefreshSession => ({
  id: "session-123",
  userId: "user-123",
  familyId: "family-123",
  tokenHash: "test-token-hash",
  replacedByTokenHash: null,
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  lastUsedAt: null,
  revokedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  user: dbUser(),
  ...overrides,
});

export const dbAdminInviteKey = (
  overrides: Partial<DbAdminInviteKey> = {},
): DbAdminInviteKey => ({
  id: "invite-key-123",
  key: "adm_valid-key-for-testing",
  used: false,
  usedBy: null,
  createdAt: new Date("2024-01-01"),
  usedAt: null,
  ...overrides,
});
