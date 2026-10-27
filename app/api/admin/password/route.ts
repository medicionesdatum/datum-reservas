import { NextResponse } from "next/server";
import { credentialMarkerForHash, getAdminIdentity, isCurrentAdminPassword } from "@/lib/admin-auth";
import { hashAdminPassword, validateNewAdminPassword } from "@/lib/admin-password";
import { adminSessionSetCookie, createAdminSessionToken } from "@/lib/admin-session";
import { consumeRateLimit } from "@/lib/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  const email = await getAdminIdentity(request);
  if (!email) {
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
  const validationError = validateNewAdminPassword(body?.newPassword, "");
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }
  if (await isCurrentAdminPassword(body.newPassword)) {
    return NextResponse.json({ error: "La nueva clave debe ser distinta de la actual." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "La base de datos no está configurada." }, { status: 503 });
  }

  const passwordHash = await hashAdminPassword(body.newPassword);
  const { error } = await supabase.from("admin_credentials").upsert({
    id: 1,
    password_hash: passwordHash,
    updated_at: new Date().toISOString()
  });

  if (error) {
    return NextResponse.json(
      { error: "No se pudo guardar la nueva clave. Revisa que la migración admin_credentials esté ejecutada." },
      { status: 500 }
    );
  }

  // Las sesiones abiertas con la clave anterior caducan; esta se renueva con la nueva.
  const response = NextResponse.json({ ok: true });
  const token = createAdminSessionToken(email, credentialMarkerForHash(passwordHash));
  if (token) response.headers.append("Set-Cookie", adminSessionSetCookie(token));
  return response;
}
