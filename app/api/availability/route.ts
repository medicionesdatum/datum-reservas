import { NextResponse } from "next/server";
import { dateValueInMadrid, isValidDateValue } from "@/lib/availability";
import { expirePendingReservations } from "@/lib/pending-reservations";
import { consumeRateLimit } from "@/lib/rate-limit";
import { isDemoModeEnabled } from "@/lib/runtime-config";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  const rateLimit = consumeRateLimit(request, {
    scope: "availability",
    limit: 120,
    windowMs: 60 * 1000
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Demasiadas consultas de disponibilidad." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return isDemoModeEnabled()
      ? NextResponse.json({ unavailableSlots: [], demo: true })
      : NextResponse.json({ error: "La agenda no está disponible temporalmente." }, { status: 503 });
  }

  const url = new URL(request.url);
  const from = url.searchParams.get("from") ?? dateValueInMadrid();
  const to = url.searchParams.get("to") ?? from;
  const rangeInDays = (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000;
  if (!isValidDateValue(from) || !isValidDateValue(to) || rangeInDays < 0 || rangeInDays > 62) {
    return NextResponse.json({ error: "El rango de fechas no es válido." }, { status: 400 });
  }

  await expirePendingReservations(supabase);

  const [{ data: reservations, error: reservationError }, { data: blocks, error: blockError }] =
    await Promise.all([
      supabase
        .from("reservations")
        .select("visit_date, visit_time")
        .gte("visit_date", from)
        .lte("visit_date", to)
        .not("operational_status", "in", '("cancelado","reprogramado","pago_caducado")'),
      supabase
        .from("blocked_slots")
        .select("visit_date, visit_time")
        .gte("visit_date", from)
        .lte("visit_date", to)
    ]);

  if (reservationError || blockError) {
    return NextResponse.json(
      { error: reservationError?.message ?? blockError?.message },
      { status: 500 }
    );
  }

  const unavailableSlots = [...(reservations ?? []), ...(blocks ?? [])].map(
    (slot) => `${slot.visit_date}|${slot.visit_time}`
  );

  return NextResponse.json({ unavailableSlots });
}
