import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ unavailableSlots: [] });

  const url = new URL(request.url);
  const from = url.searchParams.get("from") ?? new Date().toISOString().slice(0, 10);
  const to = url.searchParams.get("to") ?? from;

  const [{ data: reservations, error: reservationError }, { data: blocks, error: blockError }] =
    await Promise.all([
      supabase
        .from("reservations")
        .select("visit_date, visit_time")
        .gte("visit_date", from)
        .lte("visit_date", to)
        .not("operational_status", "in", '("cancelado","reprogramado")'),
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
