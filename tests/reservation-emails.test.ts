import { afterEach, describe, expect, it, vi } from "vitest";
import {
  customerReservationConfirmedEmail,
  notificationEmails
} from "@/lib/reservation-emails";

const reservation = {
  id: "res_1",
  customerName: "Cliente <prueba>",
  email: "cliente@example.com",
  phone: "+34 600 000 000",
  fullAddress: "Calle Mayor 1, Madrid",
  postalCode: "28013",
  surface: 90,
  propertyFloors: 2,
  serviceId: "plans_2d" as const,
  representation: "geometria_real" as const,
  visitDate: "2026-10-01",
  visitTime: "09:00",
  total: 544.5,
  deposit: 272.25,
  pendingBalance: 272.25,
  operationalStatus: "reserva_confirmada" as const,
  notes: "Acceso por patio"
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("reservation email content", () => {
  it("escapes customer content and generates balanced lists", () => {
    const html = customerReservationConfirmedEmail(reservation);

    expect(html).toContain("Cliente &lt;prueba&gt;");
    expect(html).not.toContain("Cliente <prueba>");
    expect(html.match(/<ul>/g)).toHaveLength(2);
    expect(html.match(/<\/ul>/g)).toHaveLength(2);
  });

  it("uses the configured DATUM recipients and trims whitespace", () => {
    vi.stubEnv(
      "RESERVATION_NOTIFICATION_EMAILS",
      "info@medicionesdatum.es, citas@medicionesdatum.es "
    );

    expect(notificationEmails()).toEqual([
      "info@medicionesdatum.es",
      "citas@medicionesdatum.es"
    ]);
  });

  it("defaults to both DATUM notification inboxes", () => {
    vi.stubEnv("RESERVATION_NOTIFICATION_EMAILS", "");
    vi.stubEnv("ADMIN_EMAILS", "");

    expect(notificationEmails()).toEqual([
      "info@medicionesdatum.es",
      "d.escobar@medicionesdatum.es"
    ]);
  });
});
