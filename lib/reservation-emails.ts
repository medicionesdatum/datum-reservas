import { services } from "@/lib/pricing";
import type { ReservationRecord, ServiceId } from "@/lib/types";

type ReservationEmailRecord = Pick<
  ReservationRecord,
  | "id"
  | "customerName"
  | "email"
  | "phone"
  | "fullAddress"
  | "postalCode"
  | "surface"
  | "propertyFloors"
  | "serviceId"
  | "representation"
  | "visitDate"
  | "visitTime"
  | "total"
  | "deposit"
  | "pendingBalance"
  | "operationalStatus"
  | "notes"
>;

export function notificationEmails() {
  return (
    process.env.RESERVATION_NOTIFICATION_EMAILS ??
    process.env.ADMIN_EMAILS ??
    "d.escobar@medicionesdatum.es"
  )
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
}

export function reservationFromDatabase(row: Record<string, unknown>): ReservationEmailRecord {
  return {
    id: String(row.id ?? ""),
    customerName: String(row.customer_name ?? ""),
    email: String(row.email ?? ""),
    phone: String(row.phone ?? ""),
    fullAddress: String(row.full_address ?? ""),
    postalCode: String(row.postal_code ?? ""),
    surface: Number(row.surface ?? 0),
    propertyFloors: Number(row.property_floors ?? 0),
    serviceId: String(row.service_id ?? "point_cloud") as ServiceId,
    representation: row.representation === "representacion_ortogonalizada"
      ? "representacion_ortogonalizada"
      : "geometria_real",
    visitDate: String(row.visit_date ?? ""),
    visitTime: String(row.visit_time ?? ""),
    total: Number(row.total ?? 0),
    deposit: Number(row.deposit ?? 0),
    pendingBalance: Number(row.pending_balance ?? 0),
    operationalStatus: String(row.operational_status ?? "pendiente_de_pago") as ReservationEmailRecord["operationalStatus"],
    notes: row.notes ? String(row.notes) : undefined
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR"
  }).format(value);
}

function formatVisitDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(`${value}T12:00:00`));
}

function escapeHtml(value: string | number | undefined | null) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function reservationDetails(record: ReservationEmailRecord) {
  const service = services[record.serviceId] ?? services.point_cloud;

  return `
    <p>
      <strong>Fecha:</strong> ${escapeHtml(formatVisitDate(record.visitDate))}<br>
      <strong>Hora:</strong> ${escapeHtml(record.visitTime)}<br>
      <strong>Dirección:</strong> ${escapeHtml(record.fullAddress)}<br>
      <strong>Superficie:</strong> ${escapeHtml(record.surface)} m²
    </p>
    <p>
      <strong>Servicio:</strong> ${escapeHtml(service.name)}<br>
      <strong>Total:</strong> ${escapeHtml(formatCurrency(record.total))}<br>
      <strong>Depósito:</strong> ${escapeHtml(formatCurrency(record.deposit))}<br>
      <strong>Saldo pendiente:</strong> ${escapeHtml(formatCurrency(record.pendingBalance))}
    </p>
  `;
}

export function customerReservationConfirmedEmail(record: ReservationEmailRecord) {
  const service = services[record.serviceId] ?? services.point_cloud;

  return `
    <div style="font-family:Arial,sans-serif;color:#102033;line-height:1.6">
      <h1 style="color:#071729">Reserva confirmada</h1>
      <p>Hola ${escapeHtml(record.customerName)},</p>
      <p>Hemos confirmado el pago del depósito para <strong>${escapeHtml(service.name)}</strong>.</p>
      ${reservationDetails(record)}
      <h2 style="color:#071729">Antes de tu medición</h2>
      <ul>
        <li>Procura que el inmueble esté accesible en todas las estancias que deban medirse.</li>
        <li>Retira, cuando sea posible, obstáculos delante de paredes, ventanas, puertas y zonas técnicas.</li>
        <li>Ten disponibles llaves, permisos de acceso, portería o contacto de la persona que recibirá al técnico.</li>
        <li>Si hay zonas comunitarias, terrazas, trasteros o garajes que deban incluirse, indícalo antes de la visita.</li>
        <li>Si necesitas reprogramar, responde a este correo lo antes posible.</li>
      </ul>
      <p>Nuestro técnico se contactará contigo para coordinar la medición en la dirección proporcionada.</p>
      <p>Gracias,<br>DATUM Mediciones</p>
    </div>
  `;
}

export function adminPendingReservationEmail(record: ReservationEmailRecord) {
  return adminReservationEmail({
    record,
    title: "Solicitud pendiente de pago",
    intro: "Un cliente ha iniciado una reserva y ha sido enviado a Square para pagar el depósito."
  });
}

export function adminConfirmedReservationEmail(record: ReservationEmailRecord) {
  return adminReservationEmail({
    record,
    title: "Reserva confirmada",
    intro: "Square confirmó el pago del depósito. El slot ya queda confirmado."
  });
}

function adminReservationEmail({
  record,
  title,
  intro
}: {
  record: ReservationEmailRecord;
  title: string;
  intro: string;
}) {
  const service = services[record.serviceId] ?? services.point_cloud;

  return `
    <div style="font-family:Arial,sans-serif;color:#102033;line-height:1.6">
      <h1 style="color:#071729">${escapeHtml(title)}</h1>
      <p>${escapeHtml(intro)}</p>
      <p>
        <strong>Cliente:</strong> ${escapeHtml(record.customerName)}<br>
        <strong>Email:</strong> ${escapeHtml(record.email)}<br>
        <strong>Teléfono:</strong> ${escapeHtml(record.phone)}
      </p>
      <p>
        <strong>Fecha:</strong> ${escapeHtml(formatVisitDate(record.visitDate))}<br>
        <strong>Hora:</strong> ${escapeHtml(record.visitTime)}<br>
        <strong>Dirección:</strong> ${escapeHtml(record.fullAddress)}<br>
        <strong>Código postal:</strong> ${escapeHtml(record.postalCode)}
      </p>
      <p>
        <strong>Servicio:</strong> ${escapeHtml(service.name)}<br>
        <strong>Superficie:</strong> ${escapeHtml(record.surface)} m²<br>
        <strong>Plantas:</strong> ${escapeHtml(record.propertyFloors)}<br>
        <strong>Representación:</strong> ${escapeHtml(record.representation.replaceAll("_", " "))}
      </p>
      <p>
        <strong>Total:</strong> ${escapeHtml(formatCurrency(record.total))}<br>
        <strong>Depósito:</strong> ${escapeHtml(formatCurrency(record.deposit))}<br>
        <strong>Estado:</strong> ${escapeHtml(record.operationalStatus)}
      </p>
      ${record.notes ? `<p><strong>Notas del cliente:</strong><br>${escapeHtml(record.notes)}</p>` : ""}
      <p>Reserva ID: ${escapeHtml(record.id)}</p>
    </div>
  `;
}
