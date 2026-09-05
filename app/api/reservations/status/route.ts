import { NextResponse } from "next/server";
import { consumeRateLimit } from "@/lib/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  const rateLimit = consumeRateLimit(request, {
    scope: "reservation-status",
    limit: 60,
    windowMs: 60 * 1000
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Demasiadas comprobaciones." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Falta una referencia válida." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "La consulta de reservas no está configurada." }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("reservations")
    .select("payment_status, operational_status")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Reserva no encontrada." }, { status: 404 });
  }

  return NextResponse.json(
    {
      paymentStatus: data.payment_status,
      operationalStatus: data.operational_status
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
