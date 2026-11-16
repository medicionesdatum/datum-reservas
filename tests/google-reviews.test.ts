import { describe, expect, it } from "vitest";
import {
  shortenReview,
  validateGoogleReviewInput,
  validateGoogleReviewsSettings
} from "@/lib/google-reviews";

describe("validateGoogleReviewInput", () => {
  const valid = { authorName: "  Ana  ", reviewText: "Muy profesionales y rápidos.", rating: 5, reviewLabel: "", isVisible: true };

  it("limpia y acepta una reseña válida", () => {
    expect(validateGoogleReviewInput(valid)).toEqual({
      ok: true,
      value: { authorName: "Ana", reviewText: "Muy profesionales y rápidos.", rating: 5, reviewLabel: null, isVisible: true }
    });
  });

  it("rechaza datos incompletos o fuera de rango", () => {
    expect(validateGoogleReviewInput({ ...valid, authorName: " " }).ok).toBe(false);
    expect(validateGoogleReviewInput({ ...valid, reviewText: "corto" }).ok).toBe(false);
    expect(validateGoogleReviewInput({ ...valid, rating: 0 }).ok).toBe(false);
    expect(validateGoogleReviewInput({ ...valid, rating: 4.5 }).ok).toBe(false);
    expect(validateGoogleReviewInput({ ...valid, isVisible: "si" }).ok).toBe(false);
    expect(validateGoogleReviewInput(null).ok).toBe(false);
  });
});

describe("validateGoogleReviewsSettings", () => {
  it("acepta enlaces https, nota y número de reseñas", () => {
    const result = validateGoogleReviewsSettings({
      profileUrl: "https://www.google.com/maps/place/datum",
      writeReviewUrl: "",
      ratingAverage: "4.94",
      reviewCount: "136"
    });
    expect(result).toEqual({
      ok: true,
      value: {
        profileUrl: "https://www.google.com/maps/place/datum",
        writeReviewUrl: null,
        ratingAverage: 4.9,
        reviewCount: 136
      }
    });
  });

  it("permite dejar todo vacío y rechaza valores no válidos", () => {
    expect(validateGoogleReviewsSettings({}).ok).toBe(true);
    expect(validateGoogleReviewsSettings({ profileUrl: "http://google.com" }).ok).toBe(false);
    expect(validateGoogleReviewsSettings({ profileUrl: "javascript:alert(1)" }).ok).toBe(false);
    expect(validateGoogleReviewsSettings({ ratingAverage: "6" }).ok).toBe(false);
    expect(validateGoogleReviewsSettings({ reviewCount: "-3" }).ok).toBe(false);
    expect(validateGoogleReviewsSettings({ reviewCount: "1.5" }).ok).toBe(false);
  });
});

describe("shortenReview", () => {
  it("no toca los textos cortos", () => {
    expect(shortenReview("Todo perfecto.")).toEqual({ text: "Todo perfecto.", truncated: false });
  });

  it("recorta los largos al final de una palabra", () => {
    const long = "palabra ".repeat(80);
    const result = shortenReview(long, 100);
    expect(result.truncated).toBe(true);
    expect(result.text.endsWith("…")).toBe(true);
    expect(result.text.length).toBeLessThanOrEqual(101);
    expect(result.text).not.toMatch(/palabr…$/);
  });
});
