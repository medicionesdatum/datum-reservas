import { timingSafeEqual } from "node:crypto";
import { verifyAdminPasswordHash } from "@/lib/admin-password";
import { readAdminSessionCookie, verifyAdminSessionToken } from "@/lib/admin-session";
import { consumeRateLimit } from "@/lib/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase";

const defaultAdminEmails = [
  "info@medicionesdatum.es",
  "d.escobar@medicionesdatum.es"
];

// Códigos de Postgres/PostgREST cuando la migración admin_credentials aún no se ha ejecutado.
const missingTableCodes = new Set(["42P01", "PGRST205"]);

type StoredPassword =
  | { status: "none" }
  | { status: "set"; hash: string }
  | { status: "error" };

/**
 * La clave cambiada desde el portal se guarda como hash en Supabase y tiene
 * prioridad sobre ADMIN_PASSWORD. Si la tabla no existe se usa la variable de entorno.
 */
async function getStoredPassword(): Promise<StoredPassword> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { status: "none" };

  const { data, error } = await supabase
    .from("admin_credentials")
    .select("password_hash")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    return missingTableCodes.has(error.code) ? { status: "none" } : { status: "error" };
  }
  return data?.password_hash ? { status: "set", hash: data.password_hash } : { status: "none" };
}

function getAllowedEmails() {
  const configuredEmails = process.env.ADMIN_EMAILS
    ?.split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  if (configuredEmails?.length) return configuredEmails;
  return process.env.NODE_ENV === "production" ? [] : defaultAdminEmails;
}

/** Identifica la clave vigente; las sesiones abiertas con otra clave dejan de valer. */
export function credentialMarkerForHash(hash: string) {
  return `hash:${hash}`;
}

async function getCredentialMarker(stored: StoredPassword) {
  if (stored.status === "set") return credentialMarkerForHash(stored.hash);
  const password = process.env.ADMIN_PASSWORD;
  return password && password !== "change-me" ? `env:${password}` : null;
}

async function matchesCurrentPassword(submitted: string, stored: StoredPassword) {
  if (stored.status === "error") return false;
  if (stored.status === "set") return verifyAdminPasswordHash(submitted, stored.hash);

  const password = process.env.ADMIN_PASSWORD;
  if (!password || password === "change-me") return false;

  const expectedPassword = Buffer.from(password);
  const receivedPassword = Buffer.from(submitted);
  return (
    expectedPassword.length === receivedPassword.length &&
    timingSafeEqual(expectedPassword, receivedPassword)
  );
}

/**
 * Devuelve el correo del administrador autenticado, o null. Acepta la cookie de
 * sesión o, para abrirla, el correo y la clave en cabeceras.
 */
export async function getAdminIdentity(request: Request) {
  const allowedEmails = getAllowedEmails();
  const sessionToken = readAdminSessionCookie(request);

  if (sessionToken) {
    const stored = await getStoredPassword();
    const marker = await getCredentialMarker(stored);
    const sessionEmail = marker ? verifyAdminSessionToken(sessionToken, marker) : null;
    if (sessionEmail && allowedEmails.includes(sessionEmail)) return sessionEmail;
  }

  const rateLimit = consumeRateLimit(request, {
    scope: "admin-auth",
    limit: 30,
    windowMs: 15 * 60 * 1000
  });
  if (!rateLimit.allowed) return null;

  const submittedEmail = request.headers.get("x-admin-email")?.trim().toLowerCase();
  const submittedPassword = request.headers.get("x-admin-password");
  if (!submittedEmail || !allowedEmails.includes(submittedEmail) || !submittedPassword) {
    return null;
  }

  const stored = await getStoredPassword();
  return (await matchesCurrentPassword(submittedPassword, stored)) ? submittedEmail : null;
}

export async function isAdminAuthorized(request: Request) {
  return (await getAdminIdentity(request)) !== null;
}

/** Marcador de la clave vigente, para firmar la cookie de sesión. */
export async function getCurrentCredentialMarker() {
  return getCredentialMarker(await getStoredPassword());
}

/** Comprueba una clave contra la vigente (hash guardado o ADMIN_PASSWORD). */
export async function isCurrentAdminPassword(candidate: string) {
  return matchesCurrentPassword(candidate, await getStoredPassword());
}
