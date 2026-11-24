import { describe, expect, it } from "vitest";
import {
  calculateQuote,
  getPriceRange,
  MAX_BOOKABLE_SURFACE,
  priceRanges,
  services
} from "@/lib/pricing";
import { parseReservationInput } from "@/lib/reservation-validation";
import type { ServiceId } from "@/lib/types";

const cents = (value: number) => Math.round(value * 100) / 100;

describe("tarifa de cliente", () => {
  it("los tramos son contiguos y cubren hasta el máximo reservable", () => {
    expect(priceRanges[0].min).toBe(0);
    for (let i = 1; i < priceRanges.length; i += 1) {
      expect(priceRanges[i].min).toBe(priceRanges[i - 1].max + 1);
    }
    expect(priceRanges.at(-1)?.max).toBe(MAX_BOOKABLE_SURFACE);
  });

  it("el precio 'desde' de cada servicio es el del primer tramo", () => {
    for (const id of Object.keys(services) as ServiceId[]) {
      expect(services[id].from).toBe(priceRanges[0].prices[id]);
    }
    expect(services.point_cloud.from).toBe(175);
    expect(services.plans_floor.from).toBe(250);
  });

  it("2D y 3D hasta 400 m² mantienen los precios anteriores", () => {
    const expected2d = [350, 400, 475, 550, 650, 750];
    const expected3d = [700, 800, 950, 1100, 1300, 1500];
    expect(priceRanges.slice(0, 6).map((r) => r.prices.plans_2d)).toEqual(expected2d);
    expect(priceRanges.slice(0, 6).map((r) => r.prices.revit_3d)).toEqual(expected3d);
  });

  it("calcula los casos de referencia", () => {
    const base = (serviceId: ServiceId, surface: number) => calculateQuote({ serviceId, surface }).basePrice;
    expect(base("point_cloud", 150)).toBe(275);
    expect(base("plans_floor", 50)).toBe(250);
    expect(base("plans_2d", 600)).toBe(900);
    expect(base("revit_3d", 1000)).toBe(2400);
    // Solo fachadas: superficie equivalente 150 m² con la columna "solo planta".
    expect(getPriceRange(150)?.prices.plans_floor).toBe(375);
  });

  it("calcula IVA y depósito del 50 % en cada tramo", () => {
    for (const range of priceRanges) {
      for (const id of Object.keys(services) as ServiceId[]) {
        const quote = calculateQuote({ serviceId: id, surface: range.max });
        const base = range.prices[id];
        expect(quote.isCustomQuote).toBe(false);
        expect(quote.basePrice).toBe(base);
        expect(cents(quote.vat)).toBe(cents(base * 0.21));
        expect(cents(quote.total)).toBe(cents(base * 1.21));
        expect(cents(quote.deposit)).toBe(cents(base * 1.21 * 0.5));
        expect(cents(quote.pendingBalance)).toBe(cents(base * 1.21 * 0.5));
      }
    }
  });

  it("aplica los adicionales según servicio", () => {
    // 101-150 m²: adicional 75 €
    expect(calculateQuote({ serviceId: "revit_3d", surface: 120, additionalPlans: 2, additionalSections: 5 }).additionalTotal).toBe(150);
    expect(calculateQuote({ serviceId: "plans_floor", surface: 120, additionalPlans: 1 }).additionalTotal).toBe(75);
    expect(
      calculateQuote({ serviceId: "plans_2d", surface: 120, additionalPlans: 1, additionalSections: 1, additionalElevations: 1 }).additionalTotal
    ).toBe(225);
    expect(calculateQuote({ serviceId: "point_cloud", surface: 120, additionalPlans: 3 }).additionalTotal).toBe(0);
  });

  it("por encima de 1.000 m² es presupuesto a medida", () => {
    const quote = calculateQuote({ serviceId: "plans_2d", surface: 1001 });
    expect(quote.isCustomQuote).toBe(true);
    expect(quote.total).toBe(0);
    expect(getPriceRange(1000)?.label).toBe("901-1.000 m²");
    expect(getPriceRange(1001)).toBeNull();
  });

  it("no deja huecos con superficies decimales", () => {
    expect(getPriceRange(50.5)?.label).toBe("51-100 m²");
  });
});

describe("validación de reservas con la nueva tarifa", () => {
  const now = Date.parse("2026-09-05T07:00:00Z");
  const input = {
    serviceId: "plans_floor",
    surface: 1000,
    additionalPlans: 0,
    additionalSections: 0,
    additionalElevations: 0,
    representation: "geometria_real",
    visitDate: "2026-09-07",
    visitTime: "09:00",
    customerName: "Cliente de prueba",
    email: "cliente@example.com",
    phone: "+34 600 000 000",
    fullAddress: "Calle Mayor 1",
    street: "Madrid",
    postalCode: "28001",
    propertyFloors: 1,
    requiresInvoice: true,
    billingName: "Estudio Datum SL",
    billingTaxId: "B12345678",
    billingAddress: "Calle Alcalá 10",
    billingPostalCode: "28014",
    billingCity: "Madrid",
    acceptsTerms: true,
    acceptsBalanceTerms: true,
    acceptsMarketing: false
  };

  it("acepta el servicio nuevo hasta 1.000 m² y rechaza más", () => {
    expect(parseReservationInput(input, now).error).toBeNull();
    expect(parseReservationInput({ ...input, surface: 1001 }, now).error).toMatch(/1\.000 m²/);
  });
});
