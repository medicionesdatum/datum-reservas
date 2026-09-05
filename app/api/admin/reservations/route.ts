import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { isDemoModeEnabled } from "@/lib/runtime-config";

const operationalStatuses = new Set([
  "nueva_solicitud", "pendiente_de_pago", "deposito_pagado", "reserva_confirmada",
  "visita_programada", "medicion_realizada", "en_procesamiento", "pendiente_de_saldo",
  "pagado_completo", "entregado", "pago_caducado", "cancelado", "reprogramado"
]);
const paymentStatuses = new Set(["pendiente", "deposito_pagado", "pagado_completo"]);

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

  return NextResponse.json({ reservation: data });
}
