import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { normalizeDiscountCode } from "@/lib/discount-codes";
import { getSupabaseAdmin } from "@/lib/supabase";

function serializeDate(value: unknown) {
  if (!value || typeof value !== "string") return null;
  return new Date(`${value}T23:59:59`).toISOString();
}

export async function GET(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ demo: true, discountCodes: [] });

  const { data, error } = await supabase
    .from("discount_codes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ discountCodes: data });
}

export async function POST(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const code = normalizeDiscountCode(body.code ?? "");
  const type = body.type === "fixed" ? "fixed" : "percentage";
  const value = Number(body.value);
  const maxUses = body.maxUses ? Number(body.maxUses) : null;
  const minTaxableBase = body.minTaxableBase ? Number(body.minTaxableBase) : 0;

  if (!code) return NextResponse.json({ error: "Escribe un código." }, { status: 400 });
  if (!Number.isFinite(value) || value <= 0) {
    return NextResponse.json({ error: "Introduce un valor válido." }, { status: 400 });
  }
  if (type === "percentage" && value > 100) {
    return NextResponse.json({ error: "El porcentaje no puede superar 100%." }, { status: 400 });
  }

  const record = {
    code,
    type,
    value,
    active: body.active ?? true,
    expires_at: serializeDate(body.expiresAt),
    max_uses: maxUses,
    min_taxable_base: minTaxableBase
  };

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ demo: true, discountCode: { id: crypto.randomUUID(), ...record, times_used: 0 } });

  const { data, error } = await supabase
    .from("discount_codes")
    .insert(record)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ discountCode: data });
}

export async function PATCH(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  if (!body.id) return NextResponse.json({ error: "Falta el código." }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (typeof body.active === "boolean") update.active = body.active;
  if (body.expiresAt !== undefined) update.expires_at = serializeDate(body.expiresAt);
  if (body.maxUses !== undefined) update.max_uses = body.maxUses ? Number(body.maxUses) : null;

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ demo: true, discountCode: { ...body, ...update } });

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
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta el código." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ demo: true, deleted: id });

  const { error } = await supabase.from("discount_codes").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: id });
}

