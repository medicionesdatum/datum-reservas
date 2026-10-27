import { describe, expect, it } from "vitest";
import {
  hashAdminPassword,
  validateNewAdminPassword,
  verifyAdminPasswordHash
} from "@/lib/admin-password";

describe("admin password", () => {
  it("verifies only the original password against its hash", async () => {
    const hash = await hashAdminPassword("clave-segura-123");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(await verifyAdminPasswordHash("clave-segura-123", hash)).toBe(true);
    expect(await verifyAdminPasswordHash("otra-clave-segura", hash)).toBe(false);
  });

  it("uses a different salt for every hash", async () => {
    expect(await hashAdminPassword("clave-segura-123")).not.toBe(
      await hashAdminPassword("clave-segura-123")
    );
  });

  it("rejects malformed stored hashes", async () => {
    expect(await verifyAdminPasswordHash("x", "texto-plano")).toBe(false);
    expect(await verifyAdminPasswordHash("x", "scrypt$abc$def")).toBe(false);
  });

  it("validates the new password", () => {
    expect(validateNewAdminPassword("corta", "actual")).toMatch(/al menos 12/);
    expect(validateNewAdminPassword(undefined, "actual")).toBeTruthy();
    expect(validateNewAdminPassword("x".repeat(129), "actual")).toMatch(/superar/);
    expect(validateNewAdminPassword("misma-clave-12345", "misma-clave-12345")).toMatch(/distinta/);
    expect(validateNewAdminPassword("clave-nueva-12345", "actual")).toBeNull();
  });
});
