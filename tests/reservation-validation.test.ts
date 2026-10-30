import { describe, expect, it } from "vitest";
import { parseReservationInput } from "@/lib/reservation-validation";

const validReservation = {
  serviceId: "plans_2d",
  surface: 90,
  additionalPlans: 0,
  additionalSections: 0,
  additionalElevations: 0,
  representation: "geometria_real",
  visitDate: "2026-09-07",
  visitTime: "09:00",
  customerName: "Cliente de prueba",
  email: "CLIENTE@example.com",
  phone: "+34 600 000 000",
  fullAddress: "Calle Mayor 1",
  street: "Madrid",
  postalCode: "28001",
  propertyFloors: 1,
  requiresInvoice: false,
  billingName: "",
  billingTaxId: "",
  billingAddress: "",
  billingPostalCode: "",
  billingCity: "",
  acceptsTerms: true,
  acceptsBalanceTerms: true,
  acceptsMarketing: false
};

describe("reservation validation", () => {
  const now = Date.parse("2026-09-05T07:00:00Z");

  it("normalizes valid customer data", () => {
    const result = parseReservationInput(validReservation, now);
    expect(result.error).toBeNull();
    expect(result.data?.email).toBe("cliente@example.com");
  });

  it("requires accepting both the general terms and the second payment terms", () => {
    expect(parseReservationInput({ ...validReservation, acceptsTerms: false }, now).error).toMatch(/términos/);
    for (const acceptsBalanceTerms of [false, undefined, "true", 1]) {
      const result = parseReservationInput({ ...validReservation, acceptsBalanceTerms }, now);
      expect(result.data).toBeNull();
      expect(result.error).toMatch(/segundo pago/);
    }
    expect(parseReservationInput(validReservation, now).data?.acceptsBalanceTerms).toBe(true);
  });

  it("rejects inherited service names and invalid quantities", () => {
    expect(parseReservationInput({ ...validReservation, serviceId: "toString" }, now).data).toBeNull();
    expect(parseReservationInput({ ...validReservation, additionalPlans: -1 }, now).data).toBeNull();
  });

  it("rejects invalid contact and property data", () => {
    expect(parseReservationInput({ ...validReservation, email: "invalid" }, now).data).toBeNull();
    expect(parseReservationInput({ ...validReservation, phone: "1234567" }, now).data).toBeNull();
    expect(parseReservationInput({ ...validReservation, postalCode: "28" }, now).data).toBeNull();
    expect(parseReservationInput({ ...validReservation, propertyFloors: -2 }, now).data).toBeNull();
  });

  it("requires and normalizes billing data when an invoice is requested", () => {
    const invoiced = {
      ...validReservation,
      requiresInvoice: true,
      billingName: "  Estudio Datum SL  ",
      billingTaxId: " b12345678 ",
      billingAddress: "Calle Alcalá 10",
      billingPostalCode: "28014",
      billingCity: "Madrid"
    };

    const result = parseReservationInput(invoiced, now);
    expect(result.error).toBeNull();
    expect(result.data?.billingName).toBe("Estudio Datum SL");
    expect(result.data?.billingTaxId).toBe("B12345678");
    expect(parseReservationInput({ ...invoiced, billingTaxId: "" }, now).data).toBeNull();
    expect(parseReservationInput({ ...invoiced, billingPostalCode: "28" }, now).data).toBeNull();
  });
});
