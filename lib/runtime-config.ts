export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigurationError";
  }
}

export function isDemoModeEnabled() {
  return process.env.NODE_ENV !== "production" && process.env.ALLOW_DEMO_MODE === "true";
}

export function getAppUrl() {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!raw) {
    if (isDemoModeEnabled()) return "http://localhost:3000";
    throw new ConfigurationError("Falta configurar NEXT_PUBLIC_APP_URL.");
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new ConfigurationError("NEXT_PUBLIC_APP_URL no contiene una URL válida.");
  }

  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new ConfigurationError("NEXT_PUBLIC_APP_URL debe usar HTTPS en producción.");
  }
  if (url.pathname !== "/" || url.search || url.hash) {
    throw new ConfigurationError("NEXT_PUBLIC_APP_URL debe contener únicamente el origen público.");
  }

  return url.toString().replace(/\/$/, "");
}

export function hasSupabaseConfiguration() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}

export function hasSquareConfiguration() {
  return Boolean(process.env.SQUARE_ACCESS_TOKEN && process.env.SQUARE_LOCATION_ID);
}

export function getBookingMode(): "live" | "demo" {
  if (hasSupabaseConfiguration() && hasSquareConfiguration()) return "live";
  if (isDemoModeEnabled()) return "demo";

  throw new ConfigurationError(
    "El sistema de reservas no está completamente configurado. Inténtalo de nuevo más tarde."
  );
}
