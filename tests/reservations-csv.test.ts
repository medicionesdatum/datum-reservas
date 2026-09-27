import { describe, expect, it } from "vitest";
import { buildReservationsCsv, type ReservationCsvRow } from "@/lib/reservations-csv";

const reservation: ReservationCsvRow = {
  id: "20ac6048-efcb-4c9d-a9a5-e4a9efce96d8",
  created_at: "2026-09-27T12:00:00.000Z",
  customer_name: "Cliente de prueba",
  email: "cliente@example.com",
  phone: "+34 600 000 000",
  full_address: "Calle Mayor 1, Madrid",
  postal_code: "28001",
  property_floors: 2,
  service_id: "plans_2d",
  surface: 90,
  range_label: "51-100 m²",
  additional_plans: 1,
  additional_sections: 0,
  additional_elevations: 0,
  representation: "geometria_real",
  visit_date: "2026-10-01",
  visit_time: "09:00",
  taxable_base: 450,
  vat: 94.5,
  total: 544.5,
  deposit: 272.25,
  pending_balance: 272.25,
  payment_status: "deposito_pagado",
  operational_status: "reserva_confirmada",
  notes: "Acceso por patio",
  internal_notes: "",
  accepts_marketing: false
};

describe("reservations CSV export", () => {
  it("exports Notion-friendly headers and readable reservation values", () => {
    const csv = buildReservationsCsv([reservation]);

    expect(csv).toContain('"ID de reserva","Cliente","Email","Teléfono"');
    expect(csv).toContain('"Planos 2D Estado Actual"');
    expect(csv).toContain('"Reserva confirmada","Depósito pagado"');
    expect(csv).toContain('"+34 600 000 000"');
  });

  it("escapes quotes and protects spreadsheet formulas in customer text", () => {
    const csv = buildReservationsCsv([
      {
        ...reservation,
        customer_name: '=HYPERLINK("https://example.com")',
        notes: 'Puerta "B"\nLlamar antes'
      }
    ]);

    expect(csv).toContain('"\'=HYPERLINK(""https://example.com"")"');
    expect(csv).toContain('"Puerta ""B""\nLlamar antes"');
  });
});
