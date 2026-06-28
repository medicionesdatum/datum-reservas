import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isAdminAuthorized } from "@/lib/admin-auth";

export async function GET(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ demo: true, blockedSlots: [] });

  const { data, error } = await supabase
    .from("blocked_slots")
    .select("*")
    .order("visit_date", { ascending: true })
    .order("visit_time", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ blockedSlots: data });
}

export async function POST(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  if (!body.visitDate || !body.visitTime) {
    return NextResponse.json({ error: "Selecciona una fecha y una hora." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const demoSlot = {
    id: crypto.randomUUID(),
    visit_date: body.visitDate,
    visit_time: body.visitTime,
    reason: body.reason ?? "No disponible",
    created_at: new Date().toISOString()
  };

  if (!supabase) return NextResponse.json({ demo: true, blockedSlot: demoSlot });

  const { data, error } = await supabase
    .from("blocked_slots")
    .insert({
      visit_date: body.visitDate,
      visit_time: body.visitTime,
      reason: body.reason ?? "No disponible"
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ blockedSlot: data });
}

export async function DELETE(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta el bloqueo." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ demo: true, deleted: id });

  const { error } = await supabase.from("blocked_slots").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: id });
}
