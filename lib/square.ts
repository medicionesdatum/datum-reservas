export async function createSquarePaymentLink(params: {
  reservationId: string;
  description: string;
  amountInCents: number;
  kind: "deposit" | "final";
}) {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_LOCATION_ID;
  const environment = process.env.SQUARE_ENVIRONMENT ?? "sandbox";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!token || !locationId) {
    return {
      checkoutUrl: `${appUrl}/confirmacion?reserva=${params.reservationId}&demo=1`,
      squareReference: `demo-${params.kind}-${params.reservationId}`
    };
  }

  const host =
    environment === "production"
      ? "https://connect.squareup.com"
      : "https://connect.squareupsandbox.com";

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
      pre_populated_data: {
        reference_id: `${params.kind}-${params.reservationId}`
      }
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("Square payment link failed", detail);
    throw new Error("No se pudo generar el enlace de pago. Revisa la configuración de Square.");
  }

  const payload = await response.json();
  return {
    checkoutUrl: payload.payment_link?.url as string,
    squareReference: payload.payment_link?.id as string
  };
}
