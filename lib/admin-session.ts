import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "datum_admin_session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 14 * 24 * 60 * 60;

function signingKey() {
  const material = [
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    process.env.ADMIN_PASSWORD ?? ""
  ].join("|");
  return material === "|" ? null : createHash("sha256").update(`datum-admin-session|${material}`).digest();
}

function fingerprint(credentialMarker: string) {
  return createHash("sha256").update(credentialMarker).digest("hex").slice(0, 16);
}

function sign(payload: string, key: Buffer) {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

/**
 * El token queda ligado a la clave vigente (credentialMarker): al cambiar la
 * clave, todas las sesiones anteriores dejan de ser válidas.
 */
export function createAdminSessionToken(email: string, credentialMarker: string, now = Date.now()) {
  const key = signingKey();
  if (!key) return null;
  const expiresAt = now + ADMIN_SESSION_MAX_AGE_SECONDS * 1000;
  const payload = Buffer.from(JSON.stringify([email, expiresAt, fingerprint(credentialMarker)])).toString("base64url");
  return `${payload}.${sign(payload, key)}`;
}

/** Devuelve el correo de la sesión si el token es auténtico, vigente y de la clave actual. */
export function verifyAdminSessionToken(token: string, credentialMarker: string, now = Date.now()) {
  const key = signingKey();
  const [payload, signature] = token.split(".");
  if (!key || !payload || !signature) return null;

  const expected = Buffer.from(sign(payload, key));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;

  try {
    const [email, expiresAt, tokenFingerprint] = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof email !== "string" || typeof expiresAt !== "number" || expiresAt <= now) return null;
    return tokenFingerprint === fingerprint(credentialMarker) ? email : null;
  } catch {
    return null;
  }
}

export function readAdminSessionCookie(request: Request) {
  const cookies = request.headers.get("cookie")?.split(";") ?? [];
  for (const cookie of cookies) {
    const [name, ...value] = cookie.trim().split("=");
    if (name === ADMIN_SESSION_COOKIE) return value.join("=") || null;
  }
  return null;
}

/** Valor de Set-Cookie para abrir (token) o cerrar (null) la sesión. */
export function adminSessionSetCookie(token: string | null) {
  const attributes = [
    `${ADMIN_SESSION_COOKIE}=${token ?? ""}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    `Max-Age=${token ? ADMIN_SESSION_MAX_AGE_SECONDS : 0}`
  ];
  if (process.env.NODE_ENV === "production") attributes.push("Secure");
  return attributes.join("; ");
}
