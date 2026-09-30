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
  const configured = [
    process.env.RESERVATION_NOTIFICATION_EMAILS,
    process.env.ADMIN_EMAILS
  ].find((value) => value?.trim());

  return (configured ?? "info@medicionesdatum.es,d.escobar@medicionesdatum.es")
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
  const formatted = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(`${value}T12:00:00`));

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function escapeHtml(value: string | number | undefined | null) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function customerReservationConfirmedEmail(record: ReservationEmailRecord) {
  const service = services[record.serviceId] ?? services.point_cloud;
  const contactEmail = "info@medicionesdatum.es";

  return `
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="x-apple-disable-message-reformatting">
        <title>Tu reserva con DATUM está confirmada</title>
        <style>
          @media only screen and (max-width: 620px) {
            .datum-shell { width: 100% !important; }
            .datum-pad { padding-left: 24px !important; padding-right: 24px !important; }
            .datum-hero { font-size: 34px !important; line-height: 38px !important; }
            .datum-detail { display: block !important; width: 100% !important; box-sizing: border-box !important; }
            .datum-detail-right { border-left: 0 !important; border-top: 1px solid #dbe2e8 !important; }
            .datum-total-cell { display: block !important; width: 100% !important; box-sizing: border-box !important; }
            .datum-total-right { padding-top: 0 !important; text-align: left !important; }
          }
        </style>
      </head>
      <body style="margin:0;padding:0;background-color:#edf1f3;color:#102033;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
          Hemos confirmado tu cita con DATUM. Consulta aquí la fecha, la ubicación y las indicaciones para la medición.
        </div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background-color:#edf1f3;border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:32px 12px;">
              <table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" class="datum-shell" style="width:640px;max-width:640px;background-color:#ffffff;border-collapse:collapse;">
                <tr>
                  <td style="background-color:#061729;border-right:8px solid #16d9e6;padding:34px 40px;">
                    <img src="https://medicionesdatum.es/assets/datum-logo.png" width="184" alt="DATUM" style="display:block;width:184px;max-width:100%;height:auto;border:0;">
                  </td>
                </tr>
                <tr>
                  <td class="datum-pad" style="padding:48px 48px 30px 56px;border-left:8px solid #16d9e6;">
                    <p style="margin:0 0 20px;color:#087b87;font-size:12px;font-weight:700;line-height:18px;letter-spacing:2.2px;text-transform:uppercase;">Reserva confirmada</p>
                    <h1 class="datum-hero" style="margin:0;color:#061729;font-family:Arial,Helvetica,sans-serif;font-size:46px;font-weight:400;line-height:50px;letter-spacing:-1.7px;">Tu cita ya está<br>en nuestro calendario.</h1>
                    <p style="margin:28px 0 0;color:#425466;font-size:16px;line-height:26px;">Hola, ${escapeHtml(record.customerName)}.</p>
                    <p style="margin:8px 0 0;color:#425466;font-size:16px;line-height:26px;">Hemos confirmado el pago del depósito y tu reserva ha quedado registrada correctamente.</p>
                  </td>
                </tr>
                <tr>
                  <td class="datum-pad" style="padding:0 48px 0 56px;border-left:8px solid #16d9e6;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-top:1px solid #b8c4cc;border-bottom:1px solid #b8c4cc;border-collapse:collapse;">
                      <tr>
                        <td style="padding:25px 0 23px;">
                          <p style="margin:0;color:#657786;font-size:11px;font-weight:700;line-height:16px;letter-spacing:1.8px;text-transform:uppercase;">Fecha de la medición</p>
                          <p style="margin:7px 0 0;color:#061729;font-family:Arial,Helvetica,sans-serif;font-size:25px;font-weight:700;line-height:32px;">${escapeHtml(formatVisitDate(record.visitDate))}</p>
                          <p style="margin:3px 0 0;color:#087b87;font-size:18px;font-weight:700;line-height:25px;">${escapeHtml(record.visitTime)} h</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td class="datum-pad" style="padding:30px 48px 0 56px;border-left:8px solid #16d9e6;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border:1px solid #dbe2e8;border-collapse:collapse;">
                      <tr>
                        <td width="50%" valign="top" class="datum-detail" style="width:50%;padding:20px 22px;border-bottom:1px solid #dbe2e8;">
                          <p style="margin:0;color:#657786;font-size:10px;font-weight:700;line-height:15px;letter-spacing:1.5px;text-transform:uppercase;">Servicio</p>
                          <p style="margin:6px 0 0;color:#102033;font-size:15px;font-weight:700;line-height:22px;">${escapeHtml(service.name)}</p>
                        </td>
                        <td width="50%" valign="top" class="datum-detail datum-detail-right" style="width:50%;padding:20px 22px;border-left:1px solid #dbe2e8;border-bottom:1px solid #dbe2e8;">
                          <p style="margin:0;color:#657786;font-size:10px;font-weight:700;line-height:15px;letter-spacing:1.5px;text-transform:uppercase;">Superficie</p>
                          <p style="margin:6px 0 0;color:#102033;font-size:15px;font-weight:700;line-height:22px;">${escapeHtml(record.surface)} m²</p>
                        </td>
                      </tr>
                      <tr>
                        <td width="50%" valign="top" class="datum-detail" style="width:50%;padding:20px 22px;">
                          <p style="margin:0;color:#657786;font-size:10px;font-weight:700;line-height:15px;letter-spacing:1.5px;text-transform:uppercase;">Dirección</p>
                          <p style="margin:6px 0 0;color:#102033;font-size:15px;font-weight:700;line-height:22px;">${escapeHtml(record.fullAddress)}</p>
                        </td>
                        <td width="50%" valign="top" class="datum-detail datum-detail-right" style="width:50%;padding:20px 22px;border-left:1px solid #dbe2e8;">
                          <p style="margin:0;color:#657786;font-size:10px;font-weight:700;line-height:15px;letter-spacing:1.5px;text-transform:uppercase;">Código postal</p>
                          <p style="margin:6px 0 0;color:#102033;font-size:15px;font-weight:700;line-height:22px;">${escapeHtml(record.postalCode)}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td class="datum-pad" style="padding:26px 48px 0 56px;border-left:8px solid #16d9e6;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background-color:#061729;border-collapse:collapse;">
                      <tr>
                        <td width="58%" valign="top" class="datum-total-cell" style="width:58%;padding:25px 24px;">
                          <p style="margin:0;color:#9eacb8;font-size:10px;font-weight:700;line-height:15px;letter-spacing:1.5px;text-transform:uppercase;">Resumen económico</p>
                          <p style="margin:11px 0 0;color:#dce5ec;font-size:14px;line-height:24px;">Total del servicio: <strong style="color:#ffffff;">${escapeHtml(formatCurrency(record.total))}</strong><br>Depósito abonado: <strong style="color:#ffffff;">${escapeHtml(formatCurrency(record.deposit))}</strong></p>
                        </td>
                        <td width="42%" valign="bottom" align="right" class="datum-total-cell datum-total-right" style="width:42%;padding:25px 24px;text-align:right;">
                          <p style="margin:0;color:#9eacb8;font-size:10px;font-weight:700;line-height:15px;letter-spacing:1.5px;text-transform:uppercase;">Saldo pendiente</p>
                          <p style="margin:8px 0 0;color:#16d9e6;font-family:Arial,Helvetica,sans-serif;font-size:27px;font-weight:700;line-height:32px;">${escapeHtml(formatCurrency(record.pendingBalance))}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td class="datum-pad" style="padding:40px 48px 0 56px;border-left:8px solid #16d9e6;">
                    <p style="margin:0;color:#087b87;font-size:11px;font-weight:700;line-height:16px;letter-spacing:1.8px;text-transform:uppercase;">Antes de la visita</p>
                    <h2 style="margin:9px 0 12px;color:#061729;font-family:Arial,Helvetica,sans-serif;font-size:28px;font-weight:700;line-height:35px;letter-spacing:-.5px;">Preparemos el espacio.</h2>
                    <p style="margin:0 0 22px;color:#425466;font-size:15px;line-height:25px;">Con el fin de garantizar una medición eficiente y de calidad, le trasladamos una serie de requisitos previos que deberán estar garantizados el día de la visita:</p>

                    <h3 style="margin:0 0 8px;color:#061729;font-size:14px;line-height:21px;letter-spacing:.2px;">Accesos y apertura del espacio</h3>
                    <ul style="margin:0 0 24px;padding:0 0 0 20px;color:#425466;font-size:14px;line-height:23px;">
                      <li style="margin:0 0 8px;padding-left:3px;">Todas las zonas a medir deberán estar accesibles y libres de obstáculos que impidan la circulación o la toma de datos.</li>
                      <li style="margin:0 0 8px;padding-left:3px;">Se deberá disponer de las llaves o medios de apertura necesarios para acceder a puertas, cierres, trasteros, cuartos de instalaciones o cualquier otro espacio que forme parte de la medición.</li>
                      <li style="margin:0;padding-left:3px;">En caso de que la medición incluya zonas comunes del edificio, como escaleras, patios o garajes, deberá garantizarse el acceso inmediato a las mismas.</li>
                    </ul>

                    <h3 style="margin:0 0 8px;color:#061729;font-size:14px;line-height:21px;letter-spacing:.2px;">Condiciones del espacio</h3>
                    <ul style="margin:0;padding:0 0 0 20px;color:#425466;font-size:14px;line-height:23px;">
                      <li style="margin:0 0 8px;padding-left:3px;">Los espacios deberán contar con iluminación suficiente.</li>
                      <li style="margin:0;padding-left:3px;">En caso de que existan zonas sin luz o totalmente a oscuras, deberá comunicarse con antelación para que el equipo pueda disponer del material adecuado.</li>
                    </ul>
                  </td>
                </tr>
                <tr>
                  <td class="datum-pad" style="padding:32px 48px 0 56px;border-left:8px solid #16d9e6;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background-color:#f1f4f5;border-collapse:collapse;">
                      <tr>
                        <td style="padding:24px 25px;border-left:3px solid #9aa8b2;">
                          <h3 style="margin:0 0 7px;color:#061729;font-size:14px;line-height:21px;">Consideración general</h3>
                          <p style="margin:0;color:#526473;font-size:13px;line-height:22px;">El cumplimiento de estas condiciones es fundamental para garantizar una medición continua, sin interrupciones y con el máximo nivel de precisión. En caso de que alguna de ellas no pueda cumplirse el día de la visita, le rogamos que nos lo comunique previamente para poder valorar alternativas o reprogramar si fuera necesario.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td class="datum-pad" style="padding:32px 48px 48px 56px;border-left:8px solid #16d9e6;">
                    <h2 style="margin:0 0 10px;color:#061729;font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:700;line-height:31px;letter-spacing:-.3px;">Política de cambio de fecha</h2>
                    <p style="margin:0;color:#425466;font-size:14px;line-height:23px;">Podrás solicitar un cambio de día hasta 48 horas antes de la cita. Una vez transcurrido ese plazo, cualquier modificación deberá coordinarse directamente con DATUM para valorar la disponibilidad y las alternativas posibles.</p>
                    <p style="margin:18px 0 0;color:#425466;font-size:14px;line-height:23px;">Nuestro técnico contactará contigo para coordinar la medición en la dirección proporcionada.</p>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:26px;border-collapse:collapse;">
                      <tr>
                        <td style="border:1px solid #087b87;">
                          <a href="mailto:${contactEmail}" style="display:inline-block;padding:13px 20px;color:#087b87;font-size:13px;font-weight:700;line-height:18px;text-decoration:none;">Contactar con DATUM</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px 40px;background-color:#061729;">
                    <p style="margin:0;color:#ffffff;font-size:13px;font-weight:700;line-height:20px;">DATUM Mediciones</p>
                    <p style="margin:5px 0 0;color:#9eacb8;font-size:11px;line-height:18px;">Medición precisa · Documentación fiable</p>
                    <p style="margin:12px 0 0;color:#9eacb8;font-size:11px;line-height:18px;"><a href="https://medicionesdatum.es" style="color:#16d9e6;text-decoration:none;">medicionesdatum.es</a> · <a href="mailto:${contactEmail}" style="color:#16d9e6;text-decoration:none;">${contactEmail}</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
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
