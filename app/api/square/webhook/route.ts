import { after, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { normalizeDiscountCode } from "@/lib/discount-codes";
import { sendReservationEmailBatch } from "@/lib/email";
import {
  adminConfirmedReservationEmail,
  customerReservationConfirmedEmail,
  notificationEmails,
  reservationFromDatabase
} from "@/lib/reservation-emails";
import { getAppUrl, isDemoModeEnabled } from "@/lib/runtime-config";
import { syncReservationToNotionSafely } from "@/lib/notion";
import { configuredSquareLocationId, parseSquarePaymentNote } from "@/lib/square";
import { getSupabaseAdmin } from "@/lib/supabase";

async function verifySquareSignature(request: Request, body: string) {
  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  const signature = request.headers.get("x-square-hmacsha256-signature");
  const notificationUrl = `${getAppUrl()}/api/square/webhook`;

  if (!signatureKey) return isDemoModeEnabled();
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
  const legacyReference = typeof payment?.reference_id === "string"
    ? payment.reference_id.match(/^(deposit|final)-(.+)$/)
    : null;
  const reference = parseSquarePaymentNote(payment?.note) ?? (legacyReference
    ? { kind: legacyReference[1] as "deposit" | "final", reservationId: legacyReference[2] }
    : null);

  if (!reference) {
    return NextResponse.json({ received: true, ignored: "missing_reference" });
  }

  if (payment?.status !== "COMPLETED") {
    return NextResponse.json({ received: true, ignored: "payment_not_completed" });
  }

  const { kind, reservationId } = reference;
  const supabase = getSupabaseAdmin();

  if (!['deposit', 'final'].includes(kind)) {
    return NextResponse.json({ received: true, ignored: "unknown_payment_kind" });
  }

  if (!supabase || !reservationId) {
    return NextResponse.json({ error: "Webhook storage is not configured" }, { status: 503 });
  }
  if (!payment?.id || payment?.location_id !== configuredSquareLocationId()) {
    return NextResponse.json({ error: "Payment source mismatch" }, { status: 409 });
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

  const eventId = typeof event?.event_id === "string" ? event.event_id.trim() : "";
  if (!eventId) {
    return NextResponse.json({ error: "Missing event id" }, { status: 400 });
  }

  const { error: claimError } = await supabase.from("square_webhook_events").insert({
    event_id: eventId,
    event_type: event.type,
    payment_id: payment.id,
    reservation_id: reservationId
  });
  if (claimError?.code === "23505") {
    after(() => syncReservationToNotionSafely(reservation, "square_duplicate"));
    return NextResponse.json({ received: true, duplicate: true });
  }
  if (claimError) return NextResponse.json({ error: claimError.message }, { status: 500 });

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
    await supabase.from("square_webhook_events").delete().eq("event_id", eventId);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const updatedReservation = { ...reservation, ...update };
  after(() => syncReservationToNotionSafely(updatedReservation, `square_${kind}`));

  if (kind === "deposit") {
    if (!wasAlreadyPaid && reservation.coupon_code) {
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
          const { error: incrementError } = await supabase.rpc("increment_discount_code_usage", {
            target_id: coupon.id
          });
          if (incrementError) {
            console.error("Could not increment discount usage", {
              discountCodeId: coupon.id,
              error: incrementError.message
            });
          }
        }
      }
    }

    const emailRecord = reservationFromDatabase(updatedReservation);

    try {
      await sendReservationEmailBatch(
        [
          {
            to: emailRecord.email,
            subject: "Reserva confirmada - DATUM Mediciones",
            html: customerReservationConfirmedEmail(emailRecord)
          },
          {
            to: notificationEmails(),
            subject: `Nueva cita confirmada DATUM - ${emailRecord.visitDate} ${emailRecord.visitTime}`,
            html: adminConfirmedReservationEmail(emailRecord)
          }
        ],
        `reservation-confirmed/${reservationId}`
      );
    } catch (emailError) {
      console.error("Could not send confirmed reservation emails", {
        reservationId,
        error: emailError instanceof Error ? emailError.message : "unknown"
      });

      const { error: releaseError } = await supabase
        .from("square_webhook_events")
        .delete()
        .eq("event_id", eventId);
      if (releaseError) {
        console.error("Could not release Square event for email retry", {
          reservationId,
          eventId,
          error: releaseError.message
        });
      }

      return NextResponse.json({ error: "Email delivery failed" }, { status: 502 });
    }
  }

  return NextResponse.json({ received: true });
}
