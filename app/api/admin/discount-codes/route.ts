import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { parseDiscountFields } from "@/lib/discount-codes";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isDemoModeEnabled } from "@/lib/runtime-config";

export async function GET(request: Request) {
  if (!(await isAdminAuthorized(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return isDemoModeEnabled()
      ? NextResponse.json({ demo: true, discountCodes: [] })
      : NextResponse.json({ error: "La base de datos no está configurada." }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("discount_codes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ discountCodes: data });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthorized(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Los datos del código no son válidos." }, { status: 400 });
  }

  const parsed = parseDiscountFields(body as Record<string, unknown>, "create");
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const record = parsed.value;

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return isDemoModeEnabled()
      ? NextResponse.json({ demo: true, discountCode: { id: crypto.randomUUID(), ...record, times_used: 0 } })
      : NextResponse.json({ error: "La base de datos no está configurada." }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("discount_codes")
    .insert(record)
    .select("*")
    .single();

  if (error) {
    const message = error.code === "23505" || error.message.includes("discount_codes_code_unique_idx")
      ? "Este código de descuento ya existe. Puedes editarlo desde la sección Descuentos."
      : error.message;
    return NextResponse.json({ error: message }, { status: 500 });
  }
  return NextResponse.json({ discountCode: data });
}

export async function PATCH(request: Request) {
  if (!(await isAdminAuthorized(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || !body.id) {
    return NextResponse.json({ error: "Falta el código." }, { status: 400 });
  }

  const parsed = parseDiscountFields(body as Record<string, unknown>, "update");
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const update = parsed.value;
  if (!Object.keys(update).length) {
    return NextResponse.json({ error: "No hay cambios que guardar." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return isDemoModeEnabled()
      ? NextResponse.json({ demo: true, discountCode: { ...body, ...update } })
      : NextResponse.json({ error: "La base de datos no está configurada." }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("discount_codes")
    .update(update)
    .eq("id", body.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ discountCode: data });
}

export async function DELETE(request: Request) {
  if (!(await isAdminAuthorized(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta el código." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return isDemoModeEnabled()
      ? NextResponse.json({ demo: true, deleted: id })
      : NextResponse.json({ error: "La base de datos no está configurada." }, { status: 503 });
  }

  const { error } = await supabase.from("discount_codes").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: id });
}
