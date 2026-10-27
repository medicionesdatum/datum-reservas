import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { hashAdminPassword, validateNewAdminPassword } from "@/lib/admin-password";
import { consumeRateLimit } from "@/lib/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  if (!(await isAdminAuthorized(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const rateLimit = consumeRateLimit(request, {
    scope: "admin-password-change",
    limit: 5,
    windowMs: 15 * 60 * 1000
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Demasiados intentos. Espera unos minutos." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  const body = await request.json().catch(() => null);
  const currentPassword = request.headers.get("x-admin-password") ?? "";
  const validationError = validateNewAdminPassword(body?.newPassword, currentPassword);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "La base de datos no está configurada." }, { status: 503 });
  }

  const { error } = await supabase.from("admin_credentials").upsert({
    id: 1,
    password_hash: await hashAdminPassword(body.newPassword),
    updated_at: new Date().toISOString()
  });

  if (error) {
    return NextResponse.json(
      { error: "No se pudo guardar la nueva clave. Revisa que la migración admin_credentials esté ejecutada." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
