import { describe, expect, it } from "vitest";
import {
  dateValueInMadrid,
  getAllowedSlots,
  isValidDateValue,
  isValidSlot,
  nextBusinessDate
} from "@/lib/availability";

describe("availability", () => {
  it("uses DATUM business hours", () => {
    expect(getAllowedSlots("2026-09-04")).toEqual(["09:00", "11:00", "15:00"]);
    expect(getAllowedSlots("2026-09-05")).toEqual([]);
    expect(getAllowedSlots("2026-09-07")).toEqual(["09:00", "11:00", "15:00", "17:00"]);
  });

  it("applies the 24-hour lead time in Europe/Madrid during summer time", () => {
    expect(isValidSlot("2026-09-07", "09:00", Date.parse("2026-09-06T06:59:00Z"))).toBe(true);
    expect(isValidSlot("2026-09-07", "09:00", Date.parse("2026-09-06T07:01:00Z"))).toBe(false);
  });

  it("calculates Madrid's date independently of the server timezone", () => {
    expect(dateValueInMadrid(Date.parse("2026-09-04T22:30:00Z"))).toBe("2026-09-05");
    expect(nextBusinessDate(Date.parse("2026-09-04T16:00:00Z"))).toBe("2026-09-07");
  });

  it("rejects impossible calendar dates", () => {
    expect(isValidDateValue("2026-02-29")).toBe(false);
    expect(isValidDateValue("2028-02-29")).toBe(true);
  });
});
