import { describe, expect, it } from "vitest";
import { publicPages } from "@/lib/site-content";

describe("publicPages", () => {
  it("cada página tiene una fecha de última modificación válida y no futura", () => {
    for (const page of publicPages) {
      const date = new Date(page.lastModified);
      expect(Number.isNaN(date.getTime()), page.path).toBe(false);
      expect(date.getTime(), page.path).toBeLessThanOrEqual(Date.now());
    }
  });

  it("no repite la misma fecha en todas las páginas", () => {
    expect(new Set(publicPages.map((page) => page.lastModified)).size).toBeGreaterThan(1);
  });
});
