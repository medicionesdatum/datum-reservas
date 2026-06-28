import { NextResponse } from "next/server";
import { isValidSlot } from "@/lib/availability";
import { sendReservationEmail } from "@/lib/email";
import { calculateQuote, services } from "@/lib/pricing";
import { createSquarePaymentLink } from "@/lib/square";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { ReservationInput, ReservationRecord } from "@/lib/types";

function cents(value: number) {
  return Math.round(value * 100);
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

    const quote = calculateQuote(input);
    const reservationId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const record: ReservationRecord = {
      ...input,
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
    }

    await sendReservationEmail({
      to: input.email,
      subject: "Solicitud recibida - DATUM Mediciones",
      html: `<p>Hola ${input.customerName}, hemos recibido tu solicitud para ${services[input.serviceId].name}.</p><p>Importe del depósito: ${quote.deposit.toFixed(2)} EUR.</p>`
    }).catch(() => null);

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
    coupon_code: record.couponCode,
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
