import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta la referencia." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ paymentStatus: "deposito_pagado", demo: true });
  }

  const { data, error } = await supabase
    .from("reservations")
    .select("payment_status, operational_status")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Reserva no encontrada." }, { status: 404 });
  }

  return NextResponse.json({
    paymentStatus: data.payment_status,
    operationalStatus: data.operational_status
  });
}
