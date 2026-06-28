const defaultAdminEmails = [
  "info@medicionesdatum.es",
  "d.escobar@medicionesdatum.es"
];

export function isAdminAuthorized(request: Request) {
  const configuredEmails = process.env.ADMIN_EMAILS
    ?.split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  const allowedEmails = configuredEmails?.length ? configuredEmails : defaultAdminEmails;
  const password = process.env.ADMIN_PASSWORD;
  const submittedEmail = request.headers.get("x-admin-email")?.trim().toLowerCase();
  const submittedPassword = request.headers.get("x-admin-password");

  return Boolean(
    password &&
    submittedEmail &&
    allowedEmails.includes(submittedEmail) &&
    submittedPassword === password
  );
}
