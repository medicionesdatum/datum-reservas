import { NextResponse } from "next/server";
import { createSquarePaymentLink } from "@/lib/square";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isAdminAuthorized } from "@/lib/admin-auth";

export async function POST(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id, pendingBalance } = await request.json();
  if (!id || !pendingBalance) {
    return NextResponse.json({ error: "Faltan datos de reserva." }, { status: 400 });
  }

  const payment = await createSquarePaymentLink({
    reservationId: id,
    description: "Saldo final DATUM Mediciones",
    amountInCents: Math.round(Number(pendingBalance) * 100),
    kind: "final"
  });

  const supabase = getSupabaseAdmin();
  if (supabase) {
    await supabase
      .from("reservations")
      .update({
        final_payment_link: payment.checkoutUrl,
        final_square_reference: payment.squareReference,
        operational_status: "pendiente_de_saldo"
      })
      .eq("id", id);
  }

  return NextResponse.json(payment);
}
