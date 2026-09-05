import type { SupabaseClient } from "@supabase/supabase-js";
import { deleteSquarePaymentLink } from "@/lib/square";

export const PAYMENT_HOLD_MINUTES = 30;

export function paymentExpirationFrom(now = Date.now()) {
  return new Date(now + PAYMENT_HOLD_MINUTES * 60 * 1000).toISOString();
}

export async function expirePendingReservations(supabase: SupabaseClient) {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("reservations")
    .select("id, deposit_square_reference")
    .eq("payment_status", "pendiente")
    .eq("operational_status", "pendiente_de_pago")
    .lt("payment_expires_at", now)
    .limit(50);

  if (error) throw error;

  for (const reservation of data ?? []) {
    const paymentLinkId = reservation.deposit_square_reference
      ? String(reservation.deposit_square_reference)
      : "";

    try {
      if (!paymentLinkId) {
        console.error("Pending reservation has no Square payment link identifier", {
          reservationId: reservation.id
        });
        continue;
      }
      await deleteSquarePaymentLink(paymentLinkId);
      const { error: updateError } = await supabase
        .from("reservations")
        .update({ operational_status: "pago_caducado" })
        .eq("id", reservation.id)
        .eq("payment_status", "pendiente")
        .eq("operational_status", "pendiente_de_pago");
      if (updateError) throw updateError;
    } catch (expirationError) {
      console.error("Could not expire pending reservation", {
        reservationId: reservation.id,
        error: expirationError instanceof Error ? expirationError.message : "unknown"
      });
    }
  }
}
