import PaymentConfirmation from "@/components/PaymentConfirmation";

export default async function ConfirmationPage({
  searchParams
}: {
  searchParams: Promise<{ reserva?: string; demo?: string }>;
}) {
  const params = await searchParams;

  return <PaymentConfirmation isDemo={Boolean(params.demo)} reservationId={params.reserva ?? ""} />;
}
