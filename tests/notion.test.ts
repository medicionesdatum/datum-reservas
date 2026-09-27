import { describe, expect, it } from "vitest";
import {
  buildNotionReservationProperties,
  isReservationEligibleForNotion,
  normalizeNotionId,
  notionReservationSchema
} from "@/lib/notion";

const schema = {
  "PROYECTO DATUM": { id: "title", name: "PROYECTO DATUM", type: "title" },
  Nombre: { id: "name", name: "Nombre", type: "rich_text" },
  Teléfono: { id: "phone", name: "Teléfono", type: "phone_number" },
  "Correo electrónico": { id: "email", name: "Correo electrónico", type: "email" },
  Actuacion: { id: "service-existing", name: "Actuacion", type: "select" },
  ...Object.fromEntries(
    Object.entries(notionReservationSchema).map(([name, definition], index) => [
      name,
      {
        id: `property-${index}`,
        name,
        type: Object.keys(definition)[0]
      }
    ])
  )
};

const reservation = {
  id: "20ac6048-efcb-4c9d-a9a5-e4a9efce96d8",
  created_at: "2026-09-27T12:00:00.000Z",
  customer_name: "Cliente de prueba",
  email: "cliente@example.com",
  phone: "+34 600 000 000",
  full_address: "Calle Mayor 1, Madrid",
  property_floors: 2,
  service_id: "plans_2d",
  surface: 90,
  range_label: "51-100 m²",
  additional_plans: 1,
  additional_sections: 0,
  additional_elevations: 1,
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
  internal_notes: "Llamar al llegar",
  accepts_marketing: false
};

describe("Notion reservation sync", () => {
  it("normalizes the database id from a Notion URL", () => {
    expect(normalizeNotionId("439216fbe135830d993d01bfddaeadd6")).toBe(
      "439216fb-e135-830d-993d-01bfddaeadd6"
    );
  });

  it("only mirrors reservations after a confirmed payment", () => {
    expect(isReservationEligibleForNotion(reservation)).toBe(true);
    expect(isReservationEligibleForNotion({ ...reservation, payment_status: "pendiente" })).toBe(false);
  });

  it("maps purchase, contact, service, scheduling and payment fields", () => {
    const properties = buildNotionReservationProperties(reservation, schema);

    expect(properties.title).toEqual({
      title: [{ type: "text", text: { content: "Calle Mayor 1, Madrid · Cliente de prueba" } }]
    });
    expect(properties.name).toEqual({
      rich_text: [{ type: "text", text: { content: "Cliente de prueba" } }]
    });
    expect(properties.phone).toEqual({ phone_number: "+34 600 000 000" });
    expect(properties.email).toEqual({ email: "cliente@example.com" });
    expect(properties["service-existing"]).toEqual({
      select: { name: "Planos 2D Estado Actual" }
    });

    const propertyByName = (name: string) => {
      const property = schema[name as keyof typeof schema];
      return properties[property.id];
    };

    expect(propertyByName("ID reserva web")).toEqual({
      rich_text: [{ type: "text", text: { content: reservation.id } }]
    });
    expect(propertyByName("Fecha de visita")).toEqual({ date: { start: "2026-10-01" } });
    expect(propertyByName("Hora de visita")).toEqual({
      rich_text: [{ type: "text", text: { content: "09:00" } }]
    });
    expect(propertyByName("Estado de pago")).toEqual({ select: { name: "Depósito pagado" } });
    expect(propertyByName("Total")).toEqual({ number: 544.5 });
    expect(propertyByName("Acepta marketing")).toEqual({ checkbox: false });
  });
});
