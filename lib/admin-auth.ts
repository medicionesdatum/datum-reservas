const defaultAdminEmails = [
  "info@medicionesdatum.es",
  "d.escobar@medicionesdatum.es"
];

export function isAdminAuthorized(request: Request) {
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
  const password = process.env.ADMIN_PASSWORD;
  const submittedEmail = request.headers.get("x-admin-email")?.trim().toLowerCase();
  const submittedPassword = request.headers.get("x-admin-password");

  const expectedPassword = Buffer.from(password ?? "");
  const receivedPassword = Buffer.from(submittedPassword ?? "");
  const validPassword = Boolean(
    password &&
      password !== "change-me" &&
      submittedPassword &&
      expectedPassword.length === receivedPassword.length &&
      timingSafeEqual(expectedPassword, receivedPassword)
  );
  const authorized = Boolean(
    password &&
    submittedEmail &&
    allowedEmails.includes(submittedEmail) &&
    validPassword
  );

  return authorized;
}
import { timingSafeEqual } from "node:crypto";
import { consumeRateLimit } from "@/lib/rate-limit";
