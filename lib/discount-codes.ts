import { getSupabaseAdmin } from "@/lib/supabase";
import type { Discount } from "@/lib/types";

export type DiscountCodeRow = {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  active: boolean;
  starts_at?: string | null;
  expires_at?: string | null;
  max_uses?: number | null;
  times_used: number;
  one_per_email?: boolean | null;
  min_taxable_base: number;
  created_at?: string;
};

export function normalizeDiscountCode(code: string) {
  return code.trim().toUpperCase();
}

/** "2027-03-17" → fin de ese día en hora de Madrid; vacío o inválido → null (sin caducidad). */
export function serializeDiscountDate(value: unknown) {
  if (!value || typeof value !== "string") return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T23:59:59+02:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

type DiscountFieldsResult =
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; error: string };

/**
 * Valida los datos de un código de descuento enviados desde el portal.
 * "create" exige código, tipo y valor; "update" solo toca los campos que lleguen
 * (si llegan tipo o valor, deben llegar los dos para validar el máximo del porcentaje).
 */
export function parseDiscountFields(body: Record<string, unknown>, mode: "create" | "update"): DiscountFieldsResult {
  const has = (key: string) => body[key] !== undefined;
  const record: Record<string, unknown> = {};

  if (mode === "create") {
    const code = normalizeDiscountCode(typeof body.code === "string" ? body.code : "");
    if (!code) return { ok: false, error: "Escribe un código." };
    record.code = code;
  }

  if (mode === "create" || has("type") || has("value")) {
    if (mode === "update" && !(has("type") && has("value"))) {
      return { ok: false, error: "Indica el tipo y el valor del descuento." };
    }
    const type = body.type === "fixed" ? "fixed" : "percentage";
    const value = Number(body.value);
    if (!Number.isFinite(value) || value <= 0) return { ok: false, error: "Introduce un valor válido." };
    if (type === "percentage" && value > 100) return { ok: false, error: "El porcentaje no puede superar 100%." };
    record.type = type;
    record.value = value;
  }

  if (mode === "create" || has("expiresAt")) {
    const raw = typeof body.expiresAt === "string" ? body.expiresAt.trim() : "";
    const expiresAt = serializeDiscountDate(raw);
    if (raw && !expiresAt) return { ok: false, error: "La fecha de caducidad no es válida." };
    record.expires_at = expiresAt;
  }

  if (mode === "create" || has("maxUses")) {
    const maxUses = body.maxUses ? Number(body.maxUses) : null;
    if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1)) {
      return { ok: false, error: "El máximo de usos no es válido." };
    }
    record.max_uses = maxUses;
  }

  if (mode === "create" || has("minTaxableBase")) {
    const minTaxableBase = body.minTaxableBase ? Number(body.minTaxableBase) : 0;
    if (!Number.isFinite(minTaxableBase) || minTaxableBase < 0) {
      return { ok: false, error: "La compra mínima no es válida." };
    }
    record.min_taxable_base = minTaxableBase;
  }

  const onePerEmail = has("onePerEmail") ? body.onePerEmail : body.one_per_email;
  if (mode === "create") record.one_per_email = Boolean(onePerEmail);
  else if (typeof onePerEmail === "boolean") record.one_per_email = onePerEmail;

  if (mode === "create") record.active = body.active ?? true;
  else if (typeof body.active === "boolean") record.active = body.active;

  return { ok: true, value: record };
}

export function rowToDiscount(row: DiscountCodeRow): Discount {
  return {
    code: row.code,
    type: row.type,
    value: Number(row.value)
  };
}

export function isDiscountUsable(row: DiscountCodeRow, subtotal: number) {
  const now = Date.now();
  const startsAt = row.starts_at ? new Date(row.starts_at).getTime() : null;
  const expiresAt = row.expires_at ? new Date(row.expires_at).getTime() : null;

  if (!row.active) return false;
  if (startsAt && startsAt > now) return false;
  if (expiresAt && expiresAt < now) return false;
  if (row.max_uses && row.times_used >= row.max_uses) return false;
  if (Number(row.min_taxable_base) > subtotal) return false;

  return true;
}

export async function hasEmailRedeemedDiscount(discountCodeId: string, email: string | undefined) {
  if (!email) return false;
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return false;

  const { data, error } = await supabase
    .from("discount_code_redemptions")
    .select("id")
    .eq("discount_code_id", discountCodeId)
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (error) return false;
  return Boolean(data);
}

export async function findUsableDiscount(code: string | undefined, subtotal: number, email?: string) {
  if (!code) return null;
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const normalized = normalizeDiscountCode(code);
  const { data, error } = await supabase
    .from("discount_codes")
    .select("*")
    .ilike("code", normalized)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as DiscountCodeRow;
  if (!isDiscountUsable(row, subtotal)) return null;
  if (row.one_per_email && (await hasEmailRedeemedDiscount(row.id, email))) return null;

  return rowToDiscount(row);
}
