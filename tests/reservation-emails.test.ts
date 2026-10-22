import { afterEach, describe, expect, it, vi } from "vitest";
import {
  adminPendingReservationEmail,
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
  requiresInvoice: true,
  billingName: "Estudio <Datum> SL",
  billingTaxId: "B12345678",
  billingAddress: "Calle Alcalá 10",
  billingPostalCode: "28014",
  billingCity: "Madrid",
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
    expect(html.match(/<ul\b/g)).toHaveLength(2);
    expect(html.match(/<\/ul>/g)).toHaveLength(2);
  });

  it("renders the DATUM confirmation design with all reservation essentials", () => {
    const html = customerReservationConfirmedEmail(reservation);

    expect(html).toContain("https://medicionesdatum.es/assets/datum-logo.png");
    expect(html).toContain("Reserva confirmada");
    expect(html).toContain("font-family:Arial,Helvetica,sans-serif");
    expect(html).not.toContain("Georgia");
    expect(html).toContain("Jueves, 1 de octubre de 2026");
    expect(html).toContain("09:00 h");
    expect(html).toContain("Planos 2D Estado Actual");
    expect(html).toContain("Calle Mayor 1, Madrid");
    expect(html).toContain("28013");
    expect(html).toContain("544,50 €");
    expect(html).toContain("272,25 €");
    expect(html).toContain("Política de cambio de fecha");
    expect(html).toContain("Accesos y apertura del espacio");
    expect(html).toContain("Condiciones del espacio");
    expect(html).toContain("mailto:info@medicionesdatum.es");
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

  it("includes escaped billing details in the internal notification", () => {
    const html = adminPendingReservationEmail(reservation);

    expect(html).toContain("Datos de facturación");
    expect(html).toContain("Estudio &lt;Datum&gt; SL");
    expect(html).toContain("B12345678");
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
