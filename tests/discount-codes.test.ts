import { describe, expect, it } from "vitest";
import { parseDiscountFields, serializeDiscountDate } from "@/lib/discount-codes";

describe("serializeDiscountDate", () => {
  it("convierte una fecha en el final de ese día", () => {
    expect(serializeDiscountDate("2027-03-17")).toBe("2027-03-17T21:59:59.000Z");
  });

  it("devuelve null si está vacía o no es válida", () => {
    expect(serializeDiscountDate("")).toBeNull();
    expect(serializeDiscountDate(undefined)).toBeNull();
    expect(serializeDiscountDate("17/03/2027")).toBeNull();
  });
});

describe("parseDiscountFields (crear)", () => {
  it("normaliza el código y rellena los valores por defecto", () => {
    const result = parseDiscountFields({ code: " datum10 ", type: "percentage", value: "10" }, "create");
    expect(result).toEqual({
      ok: true,
      value: {
        code: "DATUM10",
        type: "percentage",
        value: 10,
        expires_at: null,
        max_uses: null,
        min_taxable_base: 0,
        one_per_email: false,
        active: true
      }
    });
  });

  it("rechaza datos no válidos", () => {
    expect(parseDiscountFields({ code: " ", value: 10 }, "create").ok).toBe(false);
    expect(parseDiscountFields({ code: "A", value: 0 }, "create").ok).toBe(false);
    expect(parseDiscountFields({ code: "A", type: "percentage", value: 150 }, "create").ok).toBe(false);
    expect(parseDiscountFields({ code: "A", value: 10, maxUses: 1.5 }, "create").ok).toBe(false);
    expect(parseDiscountFields({ code: "A", value: 10, minTaxableBase: -1 }, "create").ok).toBe(false);
    expect(parseDiscountFields({ code: "A", value: 10, expiresAt: "mañana" }, "create").ok).toBe(false);
  });

  it("admite un importe fijo superior a 100", () => {
    const result = parseDiscountFields({ code: "DOLIC", type: "fixed", value: 150 }, "create");
    expect(result.ok).toBe(true);
  });
});

describe("parseDiscountFields (editar)", () => {
  it("solo incluye los campos recibidos", () => {
    expect(parseDiscountFields({ active: false }, "update")).toEqual({ ok: true, value: { active: false } });
    expect(parseDiscountFields({ id: "abc" }, "update")).toEqual({ ok: true, value: {} });
  });

  it("permite cambiar la caducidad, quitarla y cambiar el límite de usos", () => {
    expect(parseDiscountFields({ expiresAt: "2027-03-17" }, "update")).toEqual({
      ok: true,
      value: { expires_at: "2027-03-17T21:59:59.000Z" }
    });
    expect(parseDiscountFields({ expiresAt: "", maxUses: null }, "update")).toEqual({
      ok: true,
      value: { expires_at: null, max_uses: null }
    });
    expect(parseDiscountFields({ maxUses: 25 }, "update")).toEqual({ ok: true, value: { max_uses: 25 } });
  });

  it("exige tipo y valor juntos para cambiar el descuento", () => {
    expect(parseDiscountFields({ value: 20 }, "update").ok).toBe(false);
    expect(parseDiscountFields({ type: "fixed" }, "update").ok).toBe(false);
    expect(parseDiscountFields({ type: "percentage", value: 20 }, "update")).toEqual({
      ok: true,
      value: { type: "percentage", value: 20 }
    });
    expect(parseDiscountFields({ type: "percentage", value: 120 }, "update").ok).toBe(false);
  });

  it("acepta la clave one_per_email del botón rápido", () => {
    expect(parseDiscountFields({ one_per_email: true }, "update")).toEqual({
      ok: true,
      value: { one_per_email: true }
    });
  });
});
