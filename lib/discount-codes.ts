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
  min_taxable_base: number;
  created_at?: string;
};

export function normalizeDiscountCode(code: string) {
  return code.trim().toUpperCase();
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

export async function findUsableDiscount(code: string | undefined, subtotal: number) {
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

  return rowToDiscount(row);
}

