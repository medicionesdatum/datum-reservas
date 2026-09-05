import { ConfigurationError, getAppUrl, isDemoModeEnabled } from "@/lib/runtime-config";

type PaymentKind = "deposit" | "final";

function squareSettings() {
  const token = process.env.SQUARE_ACCESS_TOKEN?.trim().replace(/^Bearer\s+/i, "");
  const locationId = process.env.SQUARE_LOCATION_ID?.trim();
  const environment = (process.env.SQUARE_ENVIRONMENT ?? "sandbox").trim().toLowerCase();

  if (!token || !locationId) {
    throw new ConfigurationError("Falta completar la configuración de Square.");
  }
  if (!['sandbox', 'production'].includes(environment)) {
    throw new ConfigurationError("SQUARE_ENVIRONMENT debe ser sandbox o production.");
  }

  return {
    token,
    locationId,
    host: environment === "production"
      ? "https://connect.squareup.com"
      : "https://connect.squareupsandbox.com"
  };
}

export function squarePaymentNote(kind: PaymentKind, reservationId: string) {
  return `datum:${kind}:${reservationId}`;
}

export function parseSquarePaymentNote(value: unknown) {
  if (typeof value !== "string") return null;
  const match = value.match(/^datum:(deposit|final):([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i);
  return match ? { kind: match[1] as PaymentKind, reservationId: match[2].toLowerCase() } : null;
}

export async function createSquarePaymentLink(params: {
  reservationId: string;
  description: string;
  amountInCents: number;
  kind: PaymentKind;
  customerEmail?: string;
  customerPhone?: string;
  demo?: boolean;
}) {
  const appUrl = getAppUrl();

  if (params.demo) {
    if (!isDemoModeEnabled()) throw new ConfigurationError("El modo demo no está permitido.");
    return {
      checkoutUrl: `${appUrl}/confirmacion?reserva=${params.reservationId}&demo=1`,
      paymentLinkId: `demo-${params.kind}-${params.reservationId}`,
      demo: true
    };
  }

  if (!Number.isSafeInteger(params.amountInCents) || params.amountInCents < 1) {
    throw new Error("El importe del pago no es válido.");
  }

  const { token, locationId, host } = squareSettings();
  const normalizedPhone = params.customerPhone?.replace(/[^+\d]/g, "").slice(0, 17);
  const prePopulatedData = {
    ...(params.customerEmail ? { buyer_email: params.customerEmail } : {}),
    ...(normalizedPhone ? { buyer_phone_number: normalizedPhone } : {})
  };

  const response = await fetch(`${host}/v2/online-checkout/payment-links`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Square-Version": "2026-05-20",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      idempotency_key: `${params.kind}-${params.reservationId}`,
      quick_pay: {
        name: params.description,
        price_money: {
          amount: params.amountInCents,
          currency: "EUR"
        },
        location_id: locationId
      },
      checkout_options: {
        redirect_url: `${appUrl}/confirmacion?reserva=${params.reservationId}`
      },
      ...(Object.keys(prePopulatedData).length ? { pre_populated_data: prePopulatedData } : {}),
      payment_note: squarePaymentNote(params.kind, params.reservationId)
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("Square payment link failed", {
      detail,
      locationId,
      hasToken: Boolean(token)
    });
    throw new Error("No se pudo generar el enlace de pago. Revisa la configuración de Square.");
  }

  const payload = await response.json();
  if (
    typeof payload.payment_link?.url !== "string" ||
    typeof payload.payment_link?.id !== "string"
  ) {
    throw new Error("Square no devolvió un enlace de pago válido.");
  }
  return {
    checkoutUrl: payload.payment_link.url,
    paymentLinkId: payload.payment_link.id,
    demo: false
  };
}

export async function deleteSquarePaymentLink(paymentLinkId: string) {
  if (paymentLinkId.startsWith("demo-")) return;
  const { token, host } = squareSettings();
  const response = await fetch(`${host}/v2/online-checkout/payment-links/${encodeURIComponent(paymentLinkId)}`, {
    method: "DELETE",
    headers: {
      "Square-Version": "2026-05-20",
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok && response.status !== 404) {
    throw new Error("No se pudo cerrar el enlace de pago caducado.");
  }
}

export function configuredSquareLocationId() {
  return squareSettings().locationId;
}

export async function listSquareLocations() {
  let settings;
  try {
    settings = squareSettings();
  } catch (error) {
    return { locations: [], error: error instanceof Error ? error.message : "Square no está configurado." };
  }
  const { token, host } = settings;

  const response = await fetch(`${host}/v2/locations`, {
    headers: {
      "Content-Type": "application/json",
      "Square-Version": "2026-05-20",
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    return { locations: [], error: await response.text() };
  }

  const payload = await response.json();
  return {
    locations: (payload.locations ?? []).map((location: { id: string; name?: string; status?: string }) => ({
      id: location.id,
      name: location.name ?? "Sin nombre",
      status: location.status ?? ""
    })),
    error: null
  };
}
