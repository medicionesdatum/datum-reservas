"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function PaymentConfirmation({ reservationId, isDemo }: { reservationId: string; isDemo: boolean }) {
  const [status, setStatus] = useState<"checking" | "confirmed" | "pending" | "error">(isDemo ? "confirmed" : "checking");

  useEffect(() => {
    if (isDemo || !reservationId) return;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;

    async function checkPayment() {
      attempts += 1;
      try {
        const response = await fetch(`/api/reservations/status?id=${reservationId}`, { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error);
        if (["deposito_pagado", "pagado_completo"].includes(payload.paymentStatus)) {
          setStatus("confirmed");
          return;
        }
        if (attempts < 10) {
          timer = setTimeout(checkPayment, 2000);
        } else {
          setStatus("pending");
        }
      } catch {
        setStatus("error");
      }
    }

    checkPayment();
    return () => clearTimeout(timer);
  }, [isDemo, reservationId]);

  const confirmed = status === "confirmed";
  return (
    <main className="min-h-screen px-5 py-10">
      <section className="mx-auto flex min-h-[70vh] max-w-3xl flex-col justify-center">
        <p className="text-sm uppercase tracking-[0.22em] text-datum-cyan">
          {confirmed ? "Reserva recibida" : "Verificando el pago"}
        </p>
        <h1 className="mt-4 text-4xl font-semibold text-white md:text-6xl">
          {confirmed ? "Tu reserva ha sido confirmada." : "Estamos comprobando tu pago."}
        </h1>
        <p className="mt-6 text-lg leading-8 text-slate-200">
          {confirmed
            ? "Hemos recibido tu depósito. El equipo de DATUM se pondrá en contacto contigo para coordinar la medición."
            : status === "pending"
              ? "El pago todavía está pendiente de confirmación. Conserva esta referencia y revisaremos la operación."
              : status === "error"
                ? "No hemos podido comprobar el pago en este momento. Conserva esta referencia y contacta con DATUM si necesitas ayuda."
                : "Square está confirmando la operación. Esta comprobación puede tardar unos segundos."}
        </p>
        <p className="mt-4 text-sm text-slate-400">Referencia: <strong className="text-datum-cyan">{reservationId || "pendiente"}</strong></p>
        {isDemo ? <p className="mt-4 rounded border border-datum-line bg-white/5 p-4 text-sm text-slate-300">Modo de demostración activo: configura Square para utilizar el pago real.</p> : null}
        <Link href="/" className="mt-8 inline-flex w-fit rounded bg-datum-cyan px-6 py-3 font-semibold text-datum-ink transition hover:bg-cyan-200">Volver a DATUM</Link>
      </section>
    </main>
  );
}
