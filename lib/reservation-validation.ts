import { isValidSlot } from "@/lib/availability";
import { normalizePhoneNumber } from "@/lib/phone";
import type { RepresentationType, ReservationInput, ServiceId } from "@/lib/types";

const serviceIds = new Set<ServiceId>(["point_cloud", "plans_2d", "revit_3d"]);
const representations = new Set<RepresentationType>([
  "geometria_real",
  "representacion_ortogonalizada"
]);

function text(value: unknown, maximum: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maximum);
}

function count(value: unknown) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 20 ? parsed : null;
}

export function parseReservationInput(value: unknown, now = Date.now()):
  | { data: ReservationInput; error: null }
  | { data: null; error: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { data: null, error: "Los datos de la reserva no son válidos." };
  }

  const input = value as Record<string, unknown>;
  if (
    typeof input.surface !== "number" ||
    typeof input.propertyFloors !== "number" ||
    (input.additionalPlans !== undefined && typeof input.additionalPlans !== "number") ||
    (input.additionalSections !== undefined && typeof input.additionalSections !== "number") ||
    (input.additionalElevations !== undefined && typeof input.additionalElevations !== "number")
  ) {
    return { data: null, error: "Los datos numéricos de la reserva no son válidos." };
  }
  const serviceId = input.serviceId as ServiceId;
  const representation = input.representation as RepresentationType;
  const surface = Number(input.surface);
  const additionalPlans = count(input.additionalPlans ?? 0);
  const additionalSections = count(input.additionalSections ?? 0);
  const additionalElevations = count(input.additionalElevations ?? 0);
  const propertyFloors = Number(input.propertyFloors);
  const customerName = text(input.customerName, 120);
  const email = text(input.email, 254).toLowerCase();
  const phone = text(input.phone, 30);
  const fullAddress = text(input.fullAddress, 300);
  const street = text(input.street, 120);
  const postalCode = text(input.postalCode, 10);
  const requiresInvoice = input.requiresInvoice === true;
  const billingName = text(input.billingName, 160);
  const billingTaxId = text(input.billingTaxId, 20).toUpperCase();
  const billingAddress = text(input.billingAddress, 300);
  const billingPostalCode = text(input.billingPostalCode, 10);
  const billingCity = text(input.billingCity, 120);
  const visitDate = text(input.visitDate, 10);
  const visitTime = text(input.visitTime, 5);

  if (!serviceIds.has(serviceId)) return { data: null, error: "Selecciona un servicio válido." };
  if (!Number.isFinite(surface) || surface <= 0) return { data: null, error: "Introduce una superficie válida." };
  if (surface > 400) return { data: null, error: "Los inmuebles de más de 400 m² requieren un presupuesto personalizado." };
  if (!representations.has(representation)) return { data: null, error: "Selecciona una representación válida." };
  if (additionalPlans === null || additionalSections === null || additionalElevations === null) {
    return { data: null, error: "Las cantidades adicionales no son válidas." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(visitDate) || !isValidSlot(visitDate, visitTime, now)) {
    return { data: null, error: "Selecciona un horario disponible." };
  }
  if (customerName.length < 2) return { data: null, error: "Introduce un nombre válido." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { data: null, error: "Introduce un correo electrónico válido." };
  if (!normalizePhoneNumber(phone)) return { data: null, error: "Introduce un teléfono válido." };
  if (!fullAddress || !street) return { data: null, error: "Completa los datos del inmueble." };
  if (!/^\d{5}$/.test(postalCode)) return { data: null, error: "Introduce un código postal válido." };
  if (!Number.isInteger(propertyFloors) || propertyFloors < 1 || propertyFloors > 20) {
    return { data: null, error: "Introduce un número de plantas válido." };
  }
  if (requiresInvoice && (!billingName || !billingTaxId || !billingAddress || !billingCity)) {
    return { data: null, error: "Completa los datos de facturación." };
  }
  if (requiresInvoice && billingTaxId.length < 5) {
    return { data: null, error: "Introduce un NIF, CIF o NIE válido." };
  }
  if (requiresInvoice && !/^\d{5}$/.test(billingPostalCode)) {
    return { data: null, error: "Introduce un código postal de facturación válido." };
  }
  if (input.acceptsTerms !== true) return { data: null, error: "Debes aceptar los términos obligatorios." };

  return {
    data: {
      serviceId,
      surface,
      additionalPlans: serviceId === "point_cloud" ? 0 : additionalPlans,
      additionalSections: serviceId === "plans_2d" ? additionalSections : 0,
      additionalElevations: serviceId === "plans_2d" ? additionalElevations : 0,
      representation,
      visitDate,
      visitTime,
      customerName,
      email,
      phone,
      fullAddress,
      street,
      number: text(input.number, 30),
      floor: text(input.floor, 30),
      postalCode,
      propertyFloors,
      requiresInvoice,
      billingName: requiresInvoice ? billingName : "",
      billingTaxId: requiresInvoice ? billingTaxId : "",
      billingAddress: requiresInvoice ? billingAddress : "",
      billingPostalCode: requiresInvoice ? billingPostalCode : "",
      billingCity: requiresInvoice ? billingCity : "",
      notes: text(input.notes, 2000),
      couponCode: text(input.couponCode, 64),
      acceptsTerms: true,
      acceptsMarketing: input.acceptsMarketing === true
    },
    error: null
  };
}
