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
  return `
    <div style="font-family:Arial,sans-serif;color:#102033;line-height:1.6">
      <h1 style="color:#071729">Gracias por reservar con DATUM</h1>
      <p>Estimado/a ${escapeHtml(record.customerName)},</p>
      <p>Hemos confirmado el pago del depósito y tu reserva ha quedado registrada correctamente.</p>
      ${reservationDetails(record)}

      <h2 style="color:#071729">Política de cambio de fecha</h2>
      <p>
        Podrás solicitar un cambio de día hasta 48 horas antes de la cita.
        Una vez transcurrido ese plazo, cualquier modificación deberá coordinarse
        directamente con DATUM para valorar la disponibilidad y las alternativas posibles.
      </p>

      <h2 style="color:#071729">Consideraciones previas a la medición</h2>
      <p>
        Con el fin de garantizar una medición eficiente y de calidad, le trasladamos
        una serie de requisitos previos que deberán estar garantizados el día de la visita:
      </p>

      <h3 style="color:#071729">Accesos y apertura del espacio</h3>
      <ul>
        <li>Todas las zonas a medir deberán estar accesibles y libres de obstáculos que impidan la circulación o la toma de datos.</li>
        <li>Se deberá disponer de las llaves o medios de apertura necesarios para acceder a puertas, cierres, trasteros, cuartos de instalaciones o cualquier otro espacio que forme parte de la medición.</li>
        <li>En caso de que la medición incluya zonas comunes del edificio, como escaleras, patios o garajes, deberá garantizarse el acceso inmediato a las mismas.</li>
      </ul>

      <h3 style="color:#071729">Condiciones del espacio</h3>
      <ul>
        <li>Los espacios deberán contar con iluminación suficiente.</li>
        <li>En caso de que existan zonas sin luz o totalmente a oscuras, deberá comunicarse con antelación para que el equipo pueda disponer del material adecuado.</li>
      </ul>

      <h3 style="color:#071729">Consideración general</h3>
      <p>
        El cumplimiento de estas condiciones es fundamental para garantizar una
        medición continua, sin interrupciones y con el máximo nivel de precisión.
        En caso de que alguna de ellas no pueda cumplirse el día de la visita, le
        rogamos que nos lo comunique previamente para poder valorar alternativas
        o reprogramar si fuera necesario.
      </p>

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
