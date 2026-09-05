import { NextResponse } from "next/server";
import { ConfigurationError, getBookingMode } from "@/lib/runtime-config";
import { createSquarePaymentLink, deleteSquarePaymentLink } from "@/lib/square";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isAdminAuthorized } from "@/lib/admin-auth";

export async function POST(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let paymentLinkId: string | null = null;
  try {
    const { id } = await request.json();
    if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) {
      return NextResponse.json({ error: "Falta una reserva válida." }, { status: 400 });
    }

    if (getBookingMode() !== "live") {
      throw new ConfigurationError("El pago final solo está disponible con las integraciones activas.");
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) throw new ConfigurationError("No se puede acceder a la base de datos.");
    const { data: reservation, error: reservationError } = await supabase
      .from("reservations")
      .select("id, pending_balance, payment_status, final_payment_link")
      .eq("id", id)
      .single();
    if (reservationError || !reservation) {
      return NextResponse.json({ error: "Reserva no encontrada." }, { status: 404 });
    }
    if (reservation.payment_status === "pagado_completo") {
      return NextResponse.json({ error: "Esta reserva ya está pagada por completo." }, { status: 409 });
    }
    if (reservation.payment_status !== "deposito_pagado") {
      return NextResponse.json({ error: "El depósito debe estar confirmado antes de generar el saldo." }, { status: 409 });
    }
    if (reservation.final_payment_link) {
      return NextResponse.json({ checkoutUrl: reservation.final_payment_link, reused: true });
    }

    const pendingBalance = Number(reservation.pending_balance);
    const amountInCents = Math.round(pendingBalance * 100);
    if (!Number.isFinite(pendingBalance) || amountInCents < 1) {
      return NextResponse.json({ error: "El saldo pendiente no es válido." }, { status: 409 });
    }

    const payment = await createSquarePaymentLink({
      reservationId: id,
      description: "Saldo final DATUM Mediciones",
      amountInCents,
      kind: "final"
    });
    paymentLinkId = payment.paymentLinkId;

    const { error } = await supabase
      .from("reservations")
      .update({
        final_payment_link: payment.checkoutUrl,
        final_square_reference: payment.paymentLinkId,
        operational_status: "pendiente_de_saldo"
      })
      .eq("id", id);
    if (error) throw error;

    return NextResponse.json(payment);
  } catch (error) {
    if (paymentLinkId) await deleteSquarePaymentLink(paymentLinkId).catch(() => null);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo generar el saldo." },
      { status: error instanceof ConfigurationError ? 503 : 500 }
    );
  }
}
