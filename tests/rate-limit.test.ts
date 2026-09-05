import { beforeEach, describe, expect, it } from "vitest";
import { consumeRateLimit, resetRateLimitsForTests } from "@/lib/rate-limit";

describe("rate limiting", () => {
  beforeEach(() => resetRateLimitsForTests());

  it("limits repeated requests per client and scope", () => {
    const request = new Request("https://example.com", {
      headers: { "x-forwarded-for": "203.0.113.10" }
    });
    expect(consumeRateLimit(request, { scope: "test", limit: 1, windowMs: 60_000 }).allowed).toBe(true);
    expect(consumeRateLimit(request, { scope: "test", limit: 1, windowMs: 60_000 }).allowed).toBe(false);
  });
});
