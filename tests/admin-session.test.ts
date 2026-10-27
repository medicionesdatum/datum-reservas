import { beforeEach, describe, expect, it } from "vitest";
import {
  adminSessionSetCookie,
  createAdminSessionToken,
  readAdminSessionCookie,
  verifyAdminSessionToken
} from "@/lib/admin-session";

describe("admin session", () => {
  beforeEach(() => {
    process.env.ADMIN_PASSWORD = "clave-de-prueba-123";
  });

  it("accepts a token only for the current credential", () => {
    const token = createAdminSessionToken("info@medicionesdatum.es", "env:clave")!;
    expect(verifyAdminSessionToken(token, "env:clave")).toBe("info@medicionesdatum.es");
    expect(verifyAdminSessionToken(token, "hash:otra-clave")).toBeNull();
  });

  it("rejects expired and tampered tokens", () => {
    const token = createAdminSessionToken("info@medicionesdatum.es", "env:clave", 1_000)!;
    expect(verifyAdminSessionToken(token, "env:clave", 1_000 + 15 * 24 * 60 * 60 * 1000)).toBeNull();

    const [payload, signature] = token.split(".");
    const forged = Buffer.from(JSON.stringify(["otro@example.com", Date.now() + 1e9, "x"])).toString("base64url");
    expect(verifyAdminSessionToken(`${forged}.${signature}`, "env:clave")).toBeNull();
    expect(verifyAdminSessionToken(`${payload}.firma-falsa`, "env:clave")).toBeNull();
    expect(verifyAdminSessionToken("basura", "env:clave")).toBeNull();
  });

  it("reads the cookie and builds a hardened Set-Cookie", () => {
    const request = new Request("https://example.com", {
      headers: { cookie: "a=1; datum_admin_session=abc.def; b=2" }
    });
    expect(readAdminSessionCookie(request)).toBe("abc.def");
    expect(adminSessionSetCookie("abc.def")).toMatch(/HttpOnly; SameSite=Strict; Max-Age=\d+/);
    expect(adminSessionSetCookie(null)).toMatch(/Max-Age=0/);
  });
});
