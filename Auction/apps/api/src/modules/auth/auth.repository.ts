import { prisma } from "../../db/prisma.js";

export const authRepository = {
  findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  },

  findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  },

  createUser(data: {
    email: string;
    passwordHash: string;
    name?: string;
    role?: "USER" | "ADMIN";
  }) {
    return prisma.user.create({
      data: {
        ...data,
        role: data.role ?? "USER",
      },
    });
  },

  createRefreshSession(data: {
    userId: string;
    familyId: string;
    tokenHash: string;
    expiresAt: Date;
  }) {
    return prisma.refreshSession.create({
      data,
    });
  },

  findRefreshSessionByTokenHash(tokenHash: string) {
    return prisma.refreshSession.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
  },

  revokeRefreshSession(id: string) {
    return prisma.refreshSession.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  },

  revokeRefreshFamily(familyId: string) {
    return prisma.refreshSession.updateMany({
      where: {
        familyId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  },

  rotateRefreshSession(data: {
    currentSessionId: string;
    nextTokenHash: string;
    userId: string;
    familyId: string;
    expiresAt: Date;
  }) {
    return prisma.$transaction(async (tx) => {
      await tx.refreshSession.update({
        where: { id: data.currentSessionId },
        data: {
          revokedAt: new Date(),
          replacedByTokenHash: data.nextTokenHash,
          lastUsedAt: new Date(),
        },
      });

      return tx.refreshSession.create({
        data: {
          userId: data.userId,
          familyId: data.familyId,
          tokenHash: data.nextTokenHash,
          expiresAt: data.expiresAt,
        },
      });
    });
  },

  // AdminInviteKey methods
  createInviteKey(key: string) {
    return prisma.adminInviteKey.create({
      data: { key },
    });
  },

  findInviteKey(key: string) {
    return prisma.adminInviteKey.findUnique({
      where: { key },
    });
  },

  markInviteKeyUsed(key: string, usedBy: string) {
    return prisma.adminInviteKey.update({
      where: { key },
      data: { used: true, usedBy, usedAt: new Date() },
    });
  },
};
