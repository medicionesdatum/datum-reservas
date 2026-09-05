import { NextResponse } from "next/server";
import { findUsableDiscount, normalizeDiscountCode } from "@/lib/discount-codes";
import { sendReservationEmail } from "@/lib/email";
import { expirePendingReservations, paymentExpirationFrom } from "@/lib/pending-reservations";
import { adminPendingReservationEmail, notificationEmails } from "@/lib/reservation-emails";
import { calculateQuote, getPriceRange, services } from "@/lib/pricing";
import { consumeRateLimit } from "@/lib/rate-limit";
import { parseReservationInput } from "@/lib/reservation-validation";
import { ConfigurationError, getBookingMode } from "@/lib/runtime-config";
import { createSquarePaymentLink, deleteSquarePaymentLink } from "@/lib/square";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { ReservationRecord } from "@/lib/types";

function cents(value: number) {
  return Math.round(value * 100);
}

export async function POST(request: Request) {
  const rateLimit = consumeRateLimit(request, {
    scope: "create-reservation",
    limit: 8,
    windowMs: 15 * 60 * 1000
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Has realizado demasiados intentos. Espera unos minutos." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  let insertedReservationId: string | null = null;
  let createdPaymentLinkId: string | null = null;

  try {
    const parsed = parseReservationInput(await request.json());
    if (!parsed.data) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const input = parsed.data;
    const bookingMode = getBookingMode();

    const supabase = getSupabaseAdmin();
    if (bookingMode === "live" && !supabase) {
      throw new ConfigurationError("No se puede acceder a la base de datos de reservas.");
    }

    if (supabase) {
      await expirePendingReservations(supabase);
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
        .not("operational_status", "in", '("cancelado","reprogramado","pago_caducado")')
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
      Math.max(0, input.serviceId === "plans_2d" ? (input.additionalSections ?? 0) : 0) +
      Math.max(0, input.serviceId === "plans_2d" ? (input.additionalElevations ?? 0) : 0);
    const subtotal = range ? range.prices[input.serviceId] + additionalCount * range.additional : 0;
    const discount = await findUsableDiscount(input.couponCode, subtotal, input.email);
    const quote = calculateQuote({ ...input, discount });
    const reservationId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const paymentExpiresAt = paymentExpirationFrom();
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
      paymentStatus: "pendiente",
      paymentExpiresAt
    };

    if (supabase) {
      const { error } = await supabase.from("reservations").insert(toDatabase(record));
      if (error?.code === "23505") {
        return NextResponse.json(
          { error: "Este horario acaba de ser reservado. Elige otra franja horaria." },
          { status: 409 }
        );
      }
      if (error) throw error;
      insertedReservationId = reservationId;
    }

    const paymentLink = await createSquarePaymentLink({
      reservationId,
      description: `Depósito DATUM - ${services[input.serviceId].name}`,
      amountInCents: cents(quote.deposit),
      kind: "deposit",
      customerEmail: input.email,
      customerPhone: input.phone,
      demo: bookingMode === "demo"
    });

    record.depositPaymentLink = paymentLink.checkoutUrl;
    record.depositSquareReference = paymentLink.paymentLinkId;
    createdPaymentLinkId = paymentLink.paymentLinkId;

    if (supabase) {
      const { error } = await supabase
        .from("reservations")
        .update({
          deposit_payment_link: record.depositPaymentLink,
          deposit_square_reference: record.depositSquareReference
        })
        .eq("id", reservationId);
      if (error) throw error;
    }

    await sendReservationEmail({
      to: notificationEmails(),
      subject: `Solicitud pendiente de pago - ${input.visitDate} ${input.visitTime}`,
      html: adminPendingReservationEmail(record)
    }).catch(() => null);

    return NextResponse.json({
      reservationId,
      checkoutUrl: paymentLink.checkoutUrl,
      expiresAt: paymentExpiresAt
    });
  } catch (error) {
    const supabase = getSupabaseAdmin();
    if (createdPaymentLinkId) {
      await deleteSquarePaymentLink(createdPaymentLinkId).catch(() => null);
    }
    if (supabase && insertedReservationId) {
      await supabase.from("reservations").delete().eq("id", insertedReservationId);
    }

    const invalidJson = error instanceof SyntaxError;
    return NextResponse.json(
      {
        error:
          invalidJson
            ? "Los datos enviados no contienen un JSON válido."
            : error instanceof Error
            ? error.message
            : "No se pudo crear la reserva."
      },
      { status: invalidJson ? 400 : error instanceof ConfigurationError ? 503 : 500 }
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
    accepts_marketing: record.acceptsMarketing,
    payment_expires_at: record.paymentExpiresAt
  };
}
