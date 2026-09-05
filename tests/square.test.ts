import { describe, expect, it } from "vitest";
import { parseSquarePaymentNote, squarePaymentNote } from "@/lib/square";

describe("Square payment references", () => {
  const reservationId = "30bd5f0a-1b7b-4ff7-97c4-e7a68a145c46";

  it("round-trips a documented payment note", () => {
    const note = squarePaymentNote("deposit", reservationId);
    expect(note).toBe(`datum:deposit:${reservationId}`);
    expect(parseSquarePaymentNote(note)).toEqual({ kind: "deposit", reservationId });
  });

  it("rejects malformed or foreign notes", () => {
    expect(parseSquarePaymentNote(`other:deposit:${reservationId}`)).toBeNull();
    expect(parseSquarePaymentNote("datum:deposit:not-a-uuid")).toBeNull();
  });
});
