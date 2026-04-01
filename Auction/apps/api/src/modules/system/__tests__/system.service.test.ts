import { describe, it, expect } from "vitest";
import { getHealthStatus } from "../system.service.js";

describe("getHealthStatus", () => {
  it("returns ok status", () => {
    const result = getHealthStatus();
    expect(result.status).toBe("ok");
  });

  it("returns ISO timestamp", () => {
    const result = getHealthStatus();
    expect(result.timestamp).toBeDefined();
    expect(() => new Date(result.timestamp)).not.toThrow();
  });
});
