import { after, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { syncReservationToNotionSafely } from "@/lib/notion";
import { isDemoModeEnabled } from "@/lib/runtime-config";
import { deleteSquarePaymentLink } from "@/lib/square";

const operationalStatuses = new Set([
  "nueva_solicitud", "pendiente_de_pago", "deposito_pagado", "reserva_confirmada",
  "visita_programada", "medicion_realizada", "en_procesamiento", "pendiente_de_saldo",
  "pagado_completo", "entregado", "pago_caducado", "cancelado", "reprogramado"
]);
const paymentStatuses = new Set(["pendiente", "deposito_pagado", "pagado_completo"]);
const testReservationIds = new Set([
  "27153463-2dda-4529-811f-6f6dff9dd190",
  "68781e7b-b621-4a70-b1e1-f0c404597948",
  "a06a38a3-e2a3-4e70-ae68-a5b27a2d8fdd",
  "62ea185c-303c-481d-ab89-ea8fba18dd06",
  "726fc1b5-0e38-446e-926a-f604fca1b164",
  "2945083d-bbf6-4981-b9ee-5a1f0e074c3c",
  "65da2492-b34d-45a3-a9bf-1fe702b7aa36",
  "f2bf2ff6-2aec-4442-9317-39a3b065ade0",
  "4ce1f590-db2a-4b82-845e-8f16911dfc39",
  "72d22355-e7a0-4e35-8053-b0e8e85e7658",
  "e384e2b2-7dea-40b2-aba2-3ef39140b80c",
  "d0168a5f-5793-4746-a7b0-7fed3c866a78",
  "cb8f05f3-b681-4b43-a5cf-1dc09fa770f1",
  "a155a194-bb07-4967-99ce-f28370796a66"
]);

export async function GET(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  if (!supabase) {
    if (!isDemoModeEnabled()) {
      return NextResponse.json({ error: "La base de datos no está configurada." }, { status: 503 });
    }
    return NextResponse.json({
      demo: true,
      reservations: []
    });
  }

  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reservations: data });
}

export async function PATCH(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const body = await request.json();

  if (typeof body.id !== "string" || !/^[0-9a-f-]{36}$/i.test(body.id)) {
    return NextResponse.json({ error: "Falta una reserva válida." }, { status: 400 });
  }
  if (!operationalStatuses.has(body.operationalStatus) || !paymentStatuses.has(body.paymentStatus)) {
    return NextResponse.json({ error: "El estado indicado no es válido." }, { status: 400 });
  }
  if (body.internalNotes !== undefined && typeof body.internalNotes !== "string") {
    return NextResponse.json({ error: "Las notas internas no son válidas." }, { status: 400 });
  }

  if (!supabase) {
    if (!isDemoModeEnabled()) {
      return NextResponse.json({ error: "La base de datos no está configurada." }, { status: 503 });
    }
    return NextResponse.json({ demo: true, reservation: body });
  }

  const { data, error } = await supabase
    .from("reservations")
    .update({
      operational_status: body.operationalStatus,
      payment_status: body.paymentStatus,
      internal_notes: body.internalNotes?.trim().slice(0, 4000) ?? null
    })
    .eq("id", body.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  after(() => syncReservationToNotionSafely(data, "admin_update"));

  return NextResponse.json({ reservation: data });
}

export async function DELETE(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  if (
    typeof body.id !== "string" ||
    !/^[0-9a-f-]{36}$/i.test(body.id) ||
    body.confirmation !== body.id
  ) {
    return NextResponse.json({ error: "Confirma una reserva válida para eliminarla." }, { status: 400 });
  }
  if (!testReservationIds.has(body.id)) {
    return NextResponse.json({ error: "La reserva no pertenece al conjunto de pruebas verificado." }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "La base de datos no está configurada." }, { status: 503 });
  }

  const { data: reservation, error: findError } = await supabase
    .from("reservations")
    .select("id, visit_date, payment_status, deposit_square_reference, final_square_reference")
    .eq("id", body.id)
    .maybeSingle();

  if (findError) return NextResponse.json({ error: findError.message }, { status: 500 });
  if (!reservation) return NextResponse.json({ error: "La reserva no existe." }, { status: 404 });
  if (reservation.payment_status !== "pendiente") {
    return NextResponse.json(
      { error: "No se puede eliminar una reserva con pagos registrados." },
      { status: 409 }
    );
  }
  if (String(reservation.visit_date) >= new Date().toISOString().slice(0, 10)) {
    return NextResponse.json(
      { error: "No se puede eliminar una reserva con fecha actual o futura." },
      { status: 409 }
    );
  }

  const { error: deleteError } = await supabase.from("reservations").delete().eq("id", body.id);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  await Promise.allSettled(
    [reservation.deposit_square_reference, reservation.final_square_reference]
      .filter((reference): reference is string => Boolean(reference))
      .map((reference) => deleteSquarePaymentLink(reference))
  );

  return NextResponse.json({ deleted: true, id: body.id });
}
