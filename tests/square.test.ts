import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { normalizePhoneNumber } from "@/lib/phone";
import {
  createSquarePaymentLink,
  deleteSquarePaymentLink,
  parseSquarePaymentNote,
  squarePaymentNote
} from "@/lib/square";

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

describe("Square integration behavior", () => {
  const reservationId = "30bd5f0a-1b7b-4ff7-97c4-e7a68a145c46";

  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://medicionesdatum.es");
    vi.stubEnv("SQUARE_ACCESS_TOKEN", "square_test_token");
    vi.stubEnv("SQUARE_LOCATION_ID", "square_location");
    vi.stubEnv("SQUARE_ENVIRONMENT", "sandbox");
  });

  it("treats a concurrently deleted payment link as already closed", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ errors: [{ code: "BAD_REQUEST" }] }),
          { status: 400 }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ errors: [{ code: "NOT_FOUND" }] }),
          { status: 404 }
        )
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(deleteSquarePaymentLink("payment_link_1")).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "DELETE" });
    expect(fetchMock.mock.calls[1][1]).not.toHaveProperty("method");
  });

  it("keeps a pending reservation when the Square link is still active", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ errors: [{ code: "SERVICE_UNAVAILABLE" }] }),
          { status: 503 }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ payment_link: { id: "payment_link_1" } }),
          { status: 200 }
        )
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(deleteSquarePaymentLink("payment_link_1")).rejects.toThrow(
      "No se pudo cerrar el enlace de pago caducado (503/SERVICE_UNAVAILABLE)."
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("normalizes Spanish and international phone formats", () => {
    expect(normalizePhoneNumber("600 000 000")).toBe("+34600000000");
    expect(normalizePhoneNumber("+34 600 000 000")).toBe("+34600000000");
    expect(normalizePhoneNumber("0034 600 000 000")).toBe("+34600000000");
    expect(normalizePhoneNumber("34 600 000 000")).toBe("+34600000000");
    expect(normalizePhoneNumber("+44 20 7946 0958")).toBe("+442079460958");
    expect(normalizePhoneNumber("1234567")).toBeNull();
  });

  it("retries without the pre-populated phone when Square rejects it", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            errors: [{ category: "INVALID_REQUEST_ERROR", code: "INVALID_PHONE_NUMBER" }]
          }),
          { status: 400 }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ payment_link: { id: "payment_link_1", url: "https://square.link/u/test" } }),
          { status: 200 }
        )
      );
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);

    await expect(
      createSquarePaymentLink({
        reservationId,
        description: "Depósito DATUM",
        amountInCents: 12100,
        kind: "deposit",
        customerEmail: "cliente@example.com",
        customerPhone: "600 000 000"
      })
    ).resolves.toEqual({
      checkoutUrl: "https://square.link/u/test",
      paymentLinkId: "payment_link_1",
      demo: false
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const firstBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    const retryBody = JSON.parse(fetchMock.mock.calls[1][1].body as string);
    expect(firstBody.pre_populated_data.buyer_phone_number).toBe("+34600000000");
    expect(retryBody.pre_populated_data).toEqual({ buyer_email: "cliente@example.com" });
    expect(retryBody.idempotency_key).toBe(`deposit-${reservationId}-without-phone`);
  });
});
