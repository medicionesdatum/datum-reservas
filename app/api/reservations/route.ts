import { NextResponse } from "next/server";
import { isValidSlot } from "@/lib/availability";
import { findUsableDiscount, normalizeDiscountCode } from "@/lib/discount-codes";
import { sendReservationEmail } from "@/lib/email";
import { calculateQuote, getPriceRange, services } from "@/lib/pricing";
import { createSquarePaymentLink } from "@/lib/square";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { ReservationInput, ReservationRecord } from "@/lib/types";

function cents(value: number) {
  return Math.round(value * 100);
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

function notificationEmails() {
  return (
    process.env.RESERVATION_NOTIFICATION_EMAILS ??
    process.env.ADMIN_EMAILS ??
    "d.escobar@medicionesdatum.es"
  )
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
}

function validateReservation(input: ReservationInput) {
  if (!input.serviceId || !services[input.serviceId]) return "Selecciona un servicio válido.";
  if (!input.surface || input.surface <= 0) return "Introduce una superficie válida.";
  if (input.surface > 400) return "Los inmuebles de más de 400 m² requieren un presupuesto personalizado.";
  if (!input.representation) return "Selecciona una representación.";
  if (!isValidSlot(input.visitDate, input.visitTime)) return "Selecciona un horario disponible.";
  if (!input.customerName || !input.email || !input.phone) return "Completa los datos personales.";
  if (!input.fullAddress || !input.postalCode) return "Completa los datos del inmueble.";
  if (!input.acceptsTerms) return "Debes aceptar los términos obligatorios.";
  return null;
}

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as ReservationInput;
    const validationError = validateReservation(input);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    if (supabase) {
      const { data: blocked, error: blockedError } = await supabase
        .from("blocked_slots")
        .select("id")
        .eq("visit_date", input.visitDate)
        .eq("visit_time", input.visitTime)
        .maybeSingle();

      if (blockedError) throw blockedError;
      if (blocked) {
        return NextResponse.json(
          { error: "Este horario no está disponible. Elige otra franja horaria." },
          { status: 409 }
        );
      }

      const { data: duplicate, error: duplicateError } = await supabase
        .from("reservations")
        .select("id")
        .eq("visit_date", input.visitDate)
        .eq("visit_time", input.visitTime)
        .not("operational_status", "in", '("cancelado","reprogramado")')
        .maybeSingle();

      if (duplicateError) throw duplicateError;
      if (duplicate) {
        return NextResponse.json(
          { error: "Este horario ya está reservado. Elige otra franja horaria." },
          { status: 409 }
        );
      }
    }

    const range = getPriceRange(input.surface);
    const additionalCount =
      Math.max(0, input.additionalPlans ?? 0) +
      Math.max(0, input.additionalSections ?? 0) +
      Math.max(0, input.additionalElevations ?? 0);
    const subtotal = range ? range.prices[input.serviceId] + additionalCount * range.additional : 0;
    const discount = await findUsableDiscount(input.couponCode, subtotal);
    const quote = calculateQuote({ ...input, discount });
    const reservationId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const record: ReservationRecord = {
      ...input,
      couponCode: discount && input.couponCode ? normalizeDiscountCode(input.couponCode) : undefined,
      id: reservationId,
      createdAt,
      rangeLabel: quote.rangeLabel,
      basePrice: quote.basePrice,
      additionalUnitPrice: quote.additionalUnitPrice,
      additionalTotal: quote.additionalTotal,
      discountAmount: quote.discountAmount,
      taxableBase: quote.taxableBase,
      vat: quote.vat,
      total: quote.total,
      deposit: quote.deposit,
      pendingBalance: quote.pendingBalance,
      operationalStatus: "pendiente_de_pago",
      paymentStatus: "pendiente"
    };

    const paymentLink = await createSquarePaymentLink({
      reservationId,
      description: `Depósito DATUM - ${services[input.serviceId].name}`,
      amountInCents: cents(quote.deposit),
      kind: "deposit"
    });

    record.depositPaymentLink = paymentLink.checkoutUrl;
    record.depositSquareReference = paymentLink.squareReference;

    if (supabase) {
      const { error } = await supabase.from("reservations").insert(toDatabase(record));
      if (error) throw error;

      if (record.couponCode) {
        const { data: coupon } = await supabase
          .from("discount_codes")
          .select("id, times_used")
          .ilike("code", record.couponCode)
          .maybeSingle();

        if (coupon) {
          await supabase
            .from("discount_codes")
            .update({ times_used: Number(coupon.times_used ?? 0) + 1 })
            .eq("id", coupon.id);
        }
      }
    }

    await Promise.allSettled([
      sendReservationEmail({
        to: input.email,
        subject: "Tu reserva en DATUM Mediciones",
        html: customerReservationEmail(record)
      }),
      sendReservationEmail({
        to: notificationEmails(),
        subject: `Nueva reserva DATUM - ${input.visitDate} ${input.visitTime}`,
        html: adminReservationEmail(record)
      })
    ]);

    return NextResponse.json({
      reservationId,
      checkoutUrl: paymentLink.checkoutUrl
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo crear la reserva."
      },
      { status: 500 }
    );
  }
}

function toDatabase(record: ReservationRecord) {
  return {
    id: record.id,
    created_at: record.createdAt,
    customer_name: record.customerName,
    email: record.email,
    phone: record.phone,
    full_address: record.fullAddress,
    street: record.street,
    number: record.number,
    floor: record.floor,
    postal_code: record.postalCode,
    surface: record.surface,
    property_floors: record.propertyFloors,
    service_id: record.serviceId,
    range_label: record.rangeLabel,
    base_price: record.basePrice,
    additional_plans: record.additionalPlans,
    additional_sections: record.additionalSections,
    additional_elevations: record.additionalElevations,
    additional_unit_price: record.additionalUnitPrice,
    additional_total: record.additionalTotal,
    representation: record.representation,
    visit_date: record.visitDate,
    visit_time: record.visitTime,
    taxable_base: record.taxableBase,
    discount_amount: record.discountAmount,
      coupon_code: record.couponCode ? normalizeDiscountCode(record.couponCode) : null,
    vat: record.vat,
    total: record.total,
    deposit: record.deposit,
    pending_balance: record.pendingBalance,
    payment_status: record.paymentStatus,
    operational_status: record.operationalStatus,
    deposit_payment_link: record.depositPaymentLink,
    deposit_square_reference: record.depositSquareReference,
    final_payment_link: record.finalPaymentLink,
    final_square_reference: record.finalSquareReference,
    notes: record.notes,
    internal_notes: record.internalNotes,
    accepts_marketing: record.acceptsMarketing
  };
}

function customerReservationEmail(record: ReservationRecord) {
  const service = services[record.serviceId];

  return `
    <div style="font-family:Arial,sans-serif;color:#102033;line-height:1.6">
      <h1 style="color:#071729">Reserva recibida</h1>
      <p>Hola ${escapeHtml(record.customerName)},</p>
      <p>Hemos recibido tu solicitud para <strong>${escapeHtml(service.name)}</strong>.</p>
      <p>
        <strong>Fecha:</strong> ${escapeHtml(formatVisitDate(record.visitDate))}<br>
        <strong>Hora:</strong> ${escapeHtml(record.visitTime)}<br>
        <strong>Dirección:</strong> ${escapeHtml(record.fullAddress)}<br>
        <strong>Superficie:</strong> ${escapeHtml(record.surface)} m²
      </p>
      <p>
        <strong>Total:</strong> ${escapeHtml(formatCurrency(record.total))}<br>
        <strong>Depósito:</strong> ${escapeHtml(formatCurrency(record.deposit))}<br>
        <strong>Saldo pendiente:</strong> ${escapeHtml(formatCurrency(record.pendingBalance))}
      </p>
      <h2 style="color:#071729">Antes de tu medición</h2>
      <ul>
        <li>Procura que el inmueble esté accesible en todas las estancias que deban medirse.</li>
        <li>Retira, cuando sea posible, obstáculos delante de paredes, ventanas, puertas y zonas técnicas.</li>
        <li>Ten disponibles llaves, permisos de acceso, portería o contacto de la persona que recibirá al técnico.</li>
        <li>Si hay zonas comunitarias, terrazas, trasteros o garajes que deban incluirse, indícalo antes de la visita.</li>
        <li>Si necesitas reprogramar, responde a este correo lo antes posible.</li>
      </ul>
      <p>Una vez confirmado el pago, nuestro técnico se contactará contigo para coordinar la medición en la dirección proporcionada.</p>
      <p>Gracias,<br>DATUM Mediciones</p>
    </div>
  `;
}

function adminReservationEmail(record: ReservationRecord) {
  const service = services[record.serviceId];

  return `
    <div style="font-family:Arial,sans-serif;color:#102033;line-height:1.6">
      <h1 style="color:#071729">Nueva reserva recibida</h1>
      <p>Se ha reservado un nuevo slot en la plataforma DATUM.</p>
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
