import { randomUUID } from "node:crypto";
import { after, NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { adjustmentCleanupPlan, validateBalanceAdjustment } from "@/lib/balance-adjustment";
import { syncReservationToNotionSafely } from "@/lib/notion";
import { ConfigurationError, getBookingMode } from "@/lib/runtime-config";
import { createSquarePaymentLink, deleteSquarePaymentLink } from "@/lib/square";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * Crea un enlace de Square aparte por el importe real a cobrar (mayor o menor que
 * el saldo pendiente). El enlace de saldo y `pending_balance` no se tocan.
 */
export async function POST(request: Request) {
  if (!(await isAdminAuthorized(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let newPaymentLinkId: string | null = null;
  let previousLinkClosed = false;
  let reservationId = "";
  try {
    const body = await request.json().catch(() => null);
    const id = body?.id;
    if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) {
      return NextResponse.json({ error: "Falta una reserva válida." }, { status: 400 });
    }
    reservationId = id;

    const adjustment = validateBalanceAdjustment({ amount: body?.amount, reason: body?.reason });
    if ("error" in adjustment) {
      return NextResponse.json({ error: adjustment.error }, { status: 400 });
    }

    if (getBookingMode() !== "live") {
      throw new ConfigurationError("El ajuste de saldo solo está disponible con las integraciones activas.");
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) throw new ConfigurationError("No se puede acceder a la base de datos.");
    const { data: reservation, error: reservationError } = await supabase
      .from("reservations")
      .select("*")
      .eq("id", id)
      .single();
    if (reservationError || !reservation) {
      return NextResponse.json({ error: "Reserva no encontrada." }, { status: 404 });
    }
    if (reservation.payment_status === "pagado_completo") {
      return NextResponse.json({ error: "Esta reserva ya está pagada por completo." }, { status: 409 });
    }
    if (reservation.payment_status !== "deposito_pagado") {
      return NextResponse.json({ error: "El depósito debe estar confirmado antes de ajustar el saldo." }, { status: 409 });
    }

    // Un ajuste anterior cobraría otro importe y el webhook lo rechazaría: se cierra antes.
    if (reservation.adjustment_payment_link && reservation.adjustment_square_reference) {
      await deleteSquarePaymentLink(reservation.adjustment_square_reference);
      previousLinkClosed = true;
    }

    const payment = await createSquarePaymentLink({
      reservationId: id,
      description: `${reservation.full_address} - Saldo final ajustado DATUM Mediciones`,
      amountInCents: adjustment.amountInCents,
      kind: "adjustment",
      idempotencyKeySuffix: `-${randomUUID()}`
    });
    newPaymentLinkId = payment.paymentLinkId;

    const update = {
      adjusted_balance: adjustment.amount,
      balance_adjustment_reason: adjustment.reason,
      adjustment_payment_link: payment.checkoutUrl,
      adjustment_square_reference: payment.paymentLinkId,
      operational_status: "pendiente_de_saldo"
    };
    const { error } = await supabase.from("reservations").update(update).eq("id", id);
    if (error) throw error;

    after(() => syncReservationToNotionSafely({ ...reservation, ...update }, "admin_balance_adjustment"));

    return NextResponse.json({ ...payment, ...update });
  } catch (error) {
    if (newPaymentLinkId) await deleteSquarePaymentLink(newPaymentLinkId).catch(() => null);
    if (previousLinkClosed && reservationId) {
      // El ajuste anterior ya no existe en Square: se limpia para que el panel no ofrezca un enlace muerto.
      await getSupabaseAdmin()
        ?.from("reservations")
        .update({ adjusted_balance: null, balance_adjustment_reason: null, adjustment_payment_link: null, adjustment_square_reference: null })
        .eq("id", reservationId);
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo generar el ajuste." },
      { status: error instanceof ConfigurationError ? 503 : 500 }
    );
  }
}

/**
 * Borra el ajuste de una reserva: cierra su enlace de Square y vuelve al saldo pendiente.
 * Reservas con el ajuste guardado antes de existir el enlace propio tienen el enlace de
 * ajuste en `final_payment_link`: también se cierra y se limpia para que «Generar saldo»
 * vuelva a cobrar el saldo pendiente.
 */
export async function DELETE(request: Request) {
  if (!(await isAdminAuthorized(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    const id = body?.id;
    if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) {
      return NextResponse.json({ error: "Falta una reserva válida." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) throw new ConfigurationError("No se puede acceder a la base de datos.");
    const { data: reservation, error: reservationError } = await supabase
      .from("reservations")
      .select("*")
      .eq("id", id)
      .single();
    if (reservationError || !reservation) {
      return NextResponse.json({ error: "Reserva no encontrada." }, { status: 404 });
    }
    if (reservation.payment_status === "pagado_completo") {
      return NextResponse.json({ error: "Esta reserva ya está pagada por completo; el ajuste no se puede borrar." }, { status: 409 });
    }

    const { hasAdjustment, legacyFinalLink, squareLinkIds } = adjustmentCleanupPlan(reservation);
    if (!hasAdjustment) {
      return NextResponse.json({ error: "Esta reserva no tiene ningún ajuste." }, { status: 409 });
    }
    for (const linkId of squareLinkIds) await deleteSquarePaymentLink(linkId);

    const update = {
      adjusted_balance: null,
      balance_adjustment_reason: null,
      adjustment_payment_link: null,
      adjustment_square_reference: null,
      ...(legacyFinalLink ? { final_payment_link: null, final_square_reference: null } : {})
    };
    const { error } = await supabase.from("reservations").update(update).eq("id", id);
    if (error) throw error;

    after(() => syncReservationToNotionSafely({ ...reservation, ...update }, "admin_balance_adjustment_cleared"));

    return NextResponse.json({ ok: true, clearedFinalLink: legacyFinalLink });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo borrar el ajuste." },
      { status: error instanceof ConfigurationError ? 503 : 500 }
    );
  }
}
