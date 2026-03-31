"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRepository = void 0;
const prisma_js_1 = require("../../db/prisma.js");
exports.authRepository = {
  findUserByEmail(email) {
    return prisma_js_1.prisma.user.findUnique({
      where: { email },
    });
  },
  findUserById(id) {
    return prisma_js_1.prisma.user.findUnique({
      where: { id },
    });
  },
  createUser(data) {
    return prisma_js_1.prisma.user.create({
      data,
    });
  },
  createRefreshSession(data) {
    return prisma_js_1.prisma.refreshSession.create({
      data,
    });
  },
  findRefreshSessionByTokenHash(tokenHash) {
    return prisma_js_1.prisma.refreshSession.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
  },
  revokeRefreshSession(id) {
    return prisma_js_1.prisma.refreshSession.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  },
};
