import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { normalizeDiscountCode } from "@/lib/discount-codes";
import { sendReservationEmail } from "@/lib/email";
import {
  adminConfirmedReservationEmail,
  customerReservationConfirmedEmail,
  notificationEmails,
  reservationFromDatabase
} from "@/lib/reservation-emails";
import { getSupabaseAdmin } from "@/lib/supabase";

async function verifySquareSignature(request: Request, body: string) {
  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  const signature = request.headers.get("x-square-hmacsha256-signature");
  const notificationUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/square/webhook`;

  if (!signatureKey) return process.env.NODE_ENV !== "production";
  if (!signature) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(signatureKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${notificationUrl}${body}`)
  );
  const expected = Buffer.from(digest).toString("base64");

  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return providedBuffer.length === expectedBuffer.length && timingSafeEqual(providedBuffer, expectedBuffer);
}

export async function POST(request: Request) {
  const body = await request.text();
  const isValid = await verifySquareSignature(request, body);

  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (event?.type !== "payment.updated") {
    return NextResponse.json({ received: true, ignored: "unsupported_event" });
  }

  const payment = event?.data?.object?.payment;
  const referenceId = payment?.reference_id as string | undefined;

  if (!referenceId) {
    return NextResponse.json({ received: true, ignored: "missing_reference" });
  }

  if (payment?.status !== "COMPLETED") {
    return NextResponse.json({ received: true, ignored: "payment_not_completed" });
  }

  const [kind, ...reservationParts] = referenceId.split("-");
  const reservationId = reservationParts.join("-");
  const supabase = getSupabaseAdmin();

  if (!['deposit', 'final'].includes(kind)) {
    return NextResponse.json({ received: true, ignored: "unknown_payment_kind" });
  }

  if (!supabase || !reservationId) {
    return NextResponse.json({ received: true, ignored: "not_configured" });
  }

  if (event?.event_id) {
    const { data: processed } = await supabase
      .from("square_webhook_events")
      .select("event_id")
      .eq("event_id", event.event_id)
      .maybeSingle();
    if (processed) return NextResponse.json({ received: true, duplicate: true });
  }

  const { data: reservation, error: reservationError } = await supabase
    .from("reservations")
    .select("*")
    .eq("id", reservationId)
    .single();

  if (reservationError || !reservation) {
    return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
  }

  const expectedAmount = Math.round(
    Number(kind === "deposit" ? reservation.deposit : reservation.pending_balance) * 100
  );
  if (payment?.amount_money?.currency !== "EUR" || Number(payment?.amount_money?.amount) !== expectedAmount) {
    return NextResponse.json({ error: "Payment amount mismatch" }, { status: 409 });
  }

  const wasAlreadyPaid =
    kind === "deposit"
      ? reservation.payment_status === "deposito_pagado" || reservation.payment_status === "pagado_completo"
      : reservation.payment_status === "pagado_completo";
  const update =
    kind === "deposit"
      ? {
          payment_status: "deposito_pagado",
          operational_status: "reserva_confirmada",
          deposit_square_reference: payment.id
        }
      : {
          payment_status: "pagado_completo",
          operational_status: "pagado_completo",
          final_square_reference: payment.id
        };

  const { error } = await supabase
    .from("reservations")
    .update(update)
    .eq("id", reservationId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }


  if (event?.event_id) {
    await supabase.from("square_webhook_events").insert({
      event_id: event.event_id,
      event_type: event.type,
      payment_id: payment.id,
      reservation_id: reservationId
    });
  }

  if (kind === "deposit" && !wasAlreadyPaid) {
    if (reservation.coupon_code) {
      const couponCode = normalizeDiscountCode(String(reservation.coupon_code));
      const { data: coupon } = await supabase
        .from("discount_codes")
        .select("id, times_used, one_per_email")
        .ilike("code", couponCode)
        .maybeSingle();

      if (coupon) {
        let shouldIncrement = true;
        if (coupon.one_per_email && reservation.email) {
          const { error: redemptionError } = await supabase.from("discount_code_redemptions").insert({
            discount_code_id: coupon.id,
            reservation_id: reservationId,
            email: String(reservation.email).trim().toLowerCase()
          });
          shouldIncrement = !redemptionError;
        }

        if (shouldIncrement) {
          await supabase
            .from("discount_codes")
            .update({ times_used: Number(coupon.times_used ?? 0) + 1 })
            .eq("id", coupon.id);
        }
      }
    }

    const emailRecord = reservationFromDatabase({
      ...reservation,
      payment_status: update.payment_status,
      operational_status: update.operational_status,
      deposit_square_reference: payment.id
    });

    await Promise.allSettled([
      sendReservationEmail({
        to: emailRecord.email,
        subject: "Reserva confirmada - DATUM Mediciones",
        html: customerReservationConfirmedEmail(emailRecord)
      }),
      sendReservationEmail({
        to: notificationEmails(),
        subject: `Reserva confirmada DATUM - ${emailRecord.visitDate} ${emailRecord.visitTime}`,
        html: adminConfirmedReservationEmail(emailRecord)
      })
    ]);
  }

  return NextResponse.json({ received: true });
}
