import { NextResponse } from "next/server";
import { getAdminIdentity, getCurrentCredentialMarker } from "@/lib/admin-auth";
import { adminSessionSetCookie, createAdminSessionToken } from "@/lib/admin-session";

export async function GET(request: Request) {
  const email = await getAdminIdentity(request);
  if (!email) return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({ authenticated: true, email });
}

/** Abre la sesión: requiere correo y clave en cabeceras y deja una cookie firmada. */
export async function POST(request: Request) {
  const email = await getAdminIdentity(request);
  const marker = await getCurrentCredentialMarker();
  const token = email && marker ? createAdminSessionToken(email, marker) : null;
  if (!email || !token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, email });
  response.headers.append("Set-Cookie", adminSessionSetCookie(token));
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.headers.append("Set-Cookie", adminSessionSetCookie(null));
  return response;
}
