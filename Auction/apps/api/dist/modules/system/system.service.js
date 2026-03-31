"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHealthStatus = void 0;
const getHealthStatus = () => {
  return {
    status: "ok",
    timestamp: new Date().toISOString(),
  };
};
exports.getHealthStatus = getHealthStatus;
