export const MIN_ADJUSTED_BALANCE = 0.01;
export const MAX_ADJUSTED_BALANCE = 50000;
export const MIN_ADJUSTMENT_REASON_LENGTH = 5;
export const MAX_ADJUSTMENT_REASON_LENGTH = 200;

type PaymentAmountFields = {
  deposit: number | string;
  pending_balance: number | string;
  adjusted_balance?: number | string | null;
};

/**
 * Importe que debe cobrar cada tipo de pago. El enlace de saldo ("final") cobra
 * siempre el saldo pendiente; el ajuste cobra el importe real escrito por el
 * administrador, mayor o menor, sin modificar el saldo pendiente.
 */
export function expectedPaymentAmount(kind: "deposit" | "final" | "adjustment", reservation: PaymentAmountFields) {
  if (kind === "deposit") return Number(reservation.deposit);
  if (kind === "final") return Number(reservation.pending_balance);

  const adjusted = reservation.adjusted_balance;
  return adjusted === null || adjusted === undefined || adjusted === "" ? Number.NaN : Number(adjusted);
}

/** Valida el ajuste enviado desde el panel. El importe puede ser mayor o menor que el saldo pendiente. */
export function validateBalanceAdjustment(input: { amount: unknown; reason: unknown }) {
  const amount = typeof input.amount === "number" ? input.amount : Number.NaN;
  if (!Number.isFinite(amount)) {
    return { error: "Escribe un importe válido." } as const;
  }

  const amountInCents = Math.round(amount * 100);
  if (Math.abs(amountInCents - amount * 100) > 1e-6) {
    return { error: "El importe admite como máximo dos decimales." } as const;
  }
  if (amountInCents < MIN_ADJUSTED_BALANCE * 100) {
    return { error: `El importe mínimo es ${MIN_ADJUSTED_BALANCE.toFixed(2)} €.` } as const;
  }
  if (amountInCents > MAX_ADJUSTED_BALANCE * 100) {
    return { error: `El importe máximo es ${MAX_ADJUSTED_BALANCE.toLocaleString("es-ES")} €.` } as const;
  }

  const reason = typeof input.reason === "string" ? input.reason.trim() : "";
  if (reason.length < MIN_ADJUSTMENT_REASON_LENGTH || reason.length > MAX_ADJUSTMENT_REASON_LENGTH) {
    return {
      error: `El motivo debe tener entre ${MIN_ADJUSTMENT_REASON_LENGTH} y ${MAX_ADJUSTMENT_REASON_LENGTH} caracteres.`
    } as const;
  }

  return { amount: amountInCents / 100, amountInCents, reason } as const;
}
