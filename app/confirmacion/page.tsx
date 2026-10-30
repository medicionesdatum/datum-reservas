import PaymentConfirmation from "@/components/PaymentConfirmation";
import { isDemoModeEnabled } from "@/lib/runtime-config";

export default async function ConfirmationPage({
  searchParams
}: {
  searchParams: Promise<{ reserva?: string; demo?: string; pago?: string }>;
}) {
  const params = await searchParams;

  return (
    <PaymentConfirmation
      isDemo={Boolean(params.demo) && isDemoModeEnabled()}
      reservationId={params.reserva ?? ""}
      isBalancePayment={params.pago === "saldo"}
    />
  );
}
