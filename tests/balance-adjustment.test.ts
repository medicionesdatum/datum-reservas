import { describe, expect, it } from "vitest";
import { expectedPaymentAmount, validateBalanceAdjustment } from "@/lib/balance-adjustment";

describe("expectedPaymentAmount", () => {
  const reservation = { deposit: 121, pending_balance: 121, adjusted_balance: 180.5 };

  it("el enlace de saldo cobra siempre el saldo pendiente, aunque haya ajuste", () => {
    expect(expectedPaymentAmount("final", reservation)).toBe(121);
    expect(expectedPaymentAmount("final", { ...reservation, adjusted_balance: null })).toBe(121);
  });

  it("el ajuste cobra el importe ajustado, mayor o menor que el saldo", () => {
    expect(expectedPaymentAmount("adjustment", reservation)).toBe(180.5);
    expect(expectedPaymentAmount("adjustment", { ...reservation, adjusted_balance: "90.00" })).toBe(90);
  });

  it("un ajuste sin importe guardado no coincide con ningún pago", () => {
    expect(expectedPaymentAmount("adjustment", { ...reservation, adjusted_balance: null })).toBeNaN();
  });

  it("el depósito cobra el depósito", () => {
    expect(expectedPaymentAmount("deposit", { deposit: "60.50", pending_balance: 121 })).toBe(60.5);
  });
});

describe("validateBalanceAdjustment", () => {
  it("acepta importes mayores y menores con motivo", () => {
    expect(validateBalanceAdjustment({ amount: 90, reason: "Descuento acordado" })).toEqual({
      amount: 90,
      amountInCents: 9000,
      reason: "Descuento acordado"
    });
    expect(validateBalanceAdjustment({ amount: 250.5, reason: "  Superficie mayor  " })).toMatchObject({
      amountInCents: 25050,
      reason: "Superficie mayor"
    });
  });

  it("rechaza importes no válidos", () => {
    for (const amount of ["90", null, Number.NaN, Infinity, 0, -5, 0.001, 10.123, 50000.01]) {
      expect(validateBalanceAdjustment({ amount, reason: "Motivo válido" })).toHaveProperty("error");
    }
  });

  it("exige un motivo razonable", () => {
    expect(validateBalanceAdjustment({ amount: 90, reason: "" })).toHaveProperty("error");
    expect(validateBalanceAdjustment({ amount: 90, reason: "abcd" })).toHaveProperty("error");
    expect(validateBalanceAdjustment({ amount: 90, reason: "x".repeat(201) })).toHaveProperty("error");
    expect(validateBalanceAdjustment({ amount: 90, reason: 42 })).toHaveProperty("error");
  });

  it("admite el tope máximo", () => {
    expect(validateBalanceAdjustment({ amount: 50000, reason: "Trabajo especial" })).toMatchObject({ amountInCents: 5000000 });
  });
});
