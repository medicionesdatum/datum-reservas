import { services } from "@/lib/pricing";

export type ReservationCsvRow = {
  id: string;
  created_at: string;
  customer_name: string;
  email: string;
  phone: string;
  full_address: string;
  postal_code: string;
  property_floors?: number;
  service_id: keyof typeof services;
  surface: number;
  range_label: string;
  additional_plans: number;
  additional_sections: number;
  additional_elevations: number;
  representation: string;
  visit_date: string;
  visit_time: string;
  taxable_base: number;
  vat: number;
  total: number;
  deposit: number;
  pending_balance: number;
  payment_status: string;
  operational_status: string;
  notes?: string | null;
  internal_notes?: string | null;
  accepts_marketing?: boolean;
};

const statusLabels: Record<string, string> = {
  nueva_solicitud: "Nueva solicitud",
  pendiente_de_pago: "Pendiente de pago",
  deposito_pagado: "Depósito pagado",
  reserva_confirmada: "Reserva confirmada",
  visita_programada: "Visita programada",
  medicion_realizada: "Medición realizada",
  en_procesamiento: "En procesamiento",
  pendiente_de_saldo: "Pendiente de saldo",
  pagado_completo: "Pagado por completo",
  entregado: "Entregado",
  pago_caducado: "Pago caducado",
  cancelado: "Cancelado",
  reprogramado: "Reprogramado",
  pendiente: "Pendiente"
};

const headers = [
  "ID de reserva",
  "Cliente",
  "Email",
  "Teléfono",
  "Dirección",
  "Código postal",
  "Plantas del inmueble",
  "Servicio",
  "Superficie (m²)",
  "Rango",
  "Planos adicionales",
  "Secciones adicionales",
  "Alzados adicionales",
  "Representación",
  "Fecha de visita",
  "Hora de visita",
  "Estado operativo",
  "Estado de pago",
  "Base imponible",
  "IVA",
  "Total",
  "Depósito",
  "Saldo pendiente",
  "Notas del cliente",
  "Notas internas",
  "Acepta marketing",
  "Creada el"
] as const;

function labelStatus(value: string) {
  return statusLabels[value] ?? value.replaceAll("_", " ");
}

function protectSpreadsheetFormula(value: string) {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function csvCell(value: string | number | boolean | null | undefined, protectFormula = true) {
  const text = value === null || value === undefined ? "" : String(value);
  const safeText = protectFormula ? protectSpreadsheetFormula(text) : text;
  return `"${safeText.replaceAll('"', '""')}"`;
}

export function buildReservationsCsv(reservations: ReservationCsvRow[]) {
  const rows = reservations.map((reservation) => [
    reservation.id,
    reservation.customer_name,
    reservation.email,
    reservation.phone,
    reservation.full_address,
    reservation.postal_code,
    reservation.property_floors,
    services[reservation.service_id]?.name ?? reservation.service_id,
    reservation.surface,
    reservation.range_label,
    reservation.additional_plans,
    reservation.additional_sections,
    reservation.additional_elevations,
    reservation.representation === "geometria_real"
      ? "Geometría real"
      : "Representación ortogonalizada",
    reservation.visit_date,
    reservation.visit_time,
    labelStatus(reservation.operational_status),
    labelStatus(reservation.payment_status),
    reservation.taxable_base,
    reservation.vat,
    reservation.total,
    reservation.deposit,
    reservation.pending_balance,
    reservation.notes,
    reservation.internal_notes,
    reservation.accepts_marketing ? "Sí" : "No",
    reservation.created_at
  ]);

  return [
    headers.map((value) => csvCell(value)).join(","),
    ...rows.map((row) =>
      row.map((value, index) => csvCell(value, index !== 3)).join(",")
    )
  ].join("\r\n");
}
