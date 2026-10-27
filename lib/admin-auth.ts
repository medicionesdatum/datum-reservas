import { timingSafeEqual } from "node:crypto";
import { verifyAdminPasswordHash } from "@/lib/admin-password";
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

export async function isAdminAuthorized(request: Request) {
  const rateLimit = consumeRateLimit(request, {
    scope: "admin-auth",
    limit: 30,
    windowMs: 15 * 60 * 1000
  });
  if (!rateLimit.allowed) return false;

  const configuredEmails = process.env.ADMIN_EMAILS
    ?.split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  const allowedEmails = configuredEmails?.length
    ? configuredEmails
    : process.env.NODE_ENV === "production"
      ? []
      : defaultAdminEmails;
  const submittedEmail = request.headers.get("x-admin-email")?.trim().toLowerCase();
  const submittedPassword = request.headers.get("x-admin-password");

  if (!submittedEmail || !allowedEmails.includes(submittedEmail) || !submittedPassword) {
    return false;
  }

  const stored = await getStoredPassword();
  if (stored.status === "error") return false;
  if (stored.status === "set") {
    return verifyAdminPasswordHash(submittedPassword, stored.hash);
  }

  const password = process.env.ADMIN_PASSWORD;
  if (!password || password === "change-me") return false;

  const expectedPassword = Buffer.from(password);
  const receivedPassword = Buffer.from(submittedPassword);
  return (
    expectedPassword.length === receivedPassword.length &&
    timingSafeEqual(expectedPassword, receivedPassword)
  );
}
