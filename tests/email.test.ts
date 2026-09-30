import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const resendMocks = vi.hoisted(() => ({
  send: vi.fn(),
  batchSend: vi.fn()
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: resendMocks.send };
    batch = { send: resendMocks.batchSend };
  }
}));

import {
  EmailConfigurationError,
  sendReservationEmail,
  sendReservationEmailBatch
} from "@/lib/email";

const message = {
  to: "cliente@example.com",
  subject: "Reserva confirmada",
  html: "<p>Confirmada</p>"
};

describe("Resend reservation email transport", () => {
  beforeEach(() => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("EMAIL_FROM", "DATUM Mediciones <info@medicionesdatum.es>");
    resendMocks.send.mockReset();
    resendMocks.batchSend.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("sends an email with the configured sender and a deterministic idempotency key", async () => {
    resendMocks.send.mockResolvedValue({ data: { id: "email_1" }, error: null });

    await expect(
      sendReservationEmail({ ...message, idempotencyKey: "reservation-pending-admin/res_1" })
    ).resolves.toEqual({ id: "email_1" });

    expect(resendMocks.send).toHaveBeenCalledWith(
      {
        from: "DATUM Mediciones <info@medicionesdatum.es>",
        ...message
      },
      { idempotencyKey: "reservation-pending-admin/res_1" }
    );
  });

  it("sends the customer and DATUM confirmations as one strict batch", async () => {
    resendMocks.batchSend.mockResolvedValue({
      data: [{ id: "email_customer" }, { id: "email_datum" }],
      error: null
    });

    const adminMessage = {
      to: ["info@medicionesdatum.es"],
      subject: "Nueva cita confirmada DATUM",
      html: "<p>Nueva cita</p>"
    };

    await sendReservationEmailBatch(
      [message, adminMessage],
      "reservation-confirmed/res_1"
    );

    expect(resendMocks.batchSend).toHaveBeenCalledWith(
      [
        { from: "DATUM Mediciones <info@medicionesdatum.es>", ...message },
        { from: "DATUM Mediciones <info@medicionesdatum.es>", ...adminMessage }
      ],
      {
        idempotencyKey: "reservation-confirmed/res_1",
        batchValidation: "strict"
      }
    );
  });

  it("fails explicitly when the Resend key is missing", async () => {
    vi.stubEnv("RESEND_API_KEY", "");

    await expect(
      sendReservationEmail({ ...message, idempotencyKey: "reservation-pending-admin/res_1" })
    ).rejects.toBeInstanceOf(EmailConfigurationError);
    expect(resendMocks.send).not.toHaveBeenCalled();
  });

  it("surfaces a Resend API rejection", async () => {
    resendMocks.send.mockResolvedValue({
      data: null,
      error: { message: "Domain is not verified" }
    });

    await expect(
      sendReservationEmail({ ...message, idempotencyKey: "reservation-pending-admin/res_1" })
    ).rejects.toThrow("Domain is not verified");
  });
});
