export type GoogleReview = {
  id: string;
  created_at: string;
  updated_at: string;
  author_name: string;
  review_text: string;
  rating: number;
  review_label: string | null;
  is_visible: boolean;
  sort_order: number;
};

export type GoogleReviewsSettings = {
  profile_url: string | null;
  write_review_url: string | null;
  rating_average: number | null;
  review_count: number | null;
};

export type GoogleReviewInput = {
  authorName: string;
  reviewText: string;
  rating: number;
  reviewLabel: string | null;
  isVisible: boolean;
};

export type GoogleReviewsSettingsInput = {
  profileUrl: string | null;
  writeReviewUrl: string | null;
  ratingAverage: number | null;
  reviewCount: number | null;
};

type Validation<T> = { ok: true; value: T } | { ok: false; error: string };

function readText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export function validateGoogleReviewInput(body: unknown): Validation<GoogleReviewInput> {
  if (!body || typeof body !== "object") return { ok: false, error: "Los datos de la reseña no son válidos." };
  const input = body as Record<string, unknown>;
  const authorName = readText(input.authorName, 80);
  const reviewText = readText(input.reviewText, 1500);
  const reviewLabel = readText(input.reviewLabel, 40);
  const rating = Number(input.rating);

  if (!authorName) return { ok: false, error: "Indica el nombre de quien escribió la reseña." };
  if (reviewText.length < 10) return { ok: false, error: "El texto de la reseña debe tener al menos 10 caracteres." };
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: "La puntuación debe ser un número entero de 1 a 5." };
  }
  if (typeof input.isVisible !== "boolean") return { ok: false, error: "Indica si la reseña se muestra en la web." };

  return {
    ok: true,
    value: { authorName, reviewText, rating, reviewLabel: reviewLabel || null, isVisible: input.isVisible }
  };
}

function readHttpsUrl(value: unknown): Validation<string | null> {
  const text = readText(value, 2000);
  if (!text) return { ok: true, value: null };
  try {
    const url = new URL(text);
    if (url.protocol !== "https:") throw new Error("not https");
    return { ok: true, value: url.toString() };
  } catch {
    return { ok: false, error: "Los enlaces deben empezar por https://." };
  }
}

export function validateGoogleReviewsSettings(body: unknown): Validation<GoogleReviewsSettingsInput> {
  if (!body || typeof body !== "object") return { ok: false, error: "Los datos de la ficha no son válidos." };
  const input = body as Record<string, unknown>;

  const profileUrl = readHttpsUrl(input.profileUrl);
  if (!profileUrl.ok) return profileUrl;
  const writeReviewUrl = readHttpsUrl(input.writeReviewUrl);
  if (!writeReviewUrl.ok) return writeReviewUrl;

  const hasRating = input.ratingAverage !== null && input.ratingAverage !== undefined && input.ratingAverage !== "";
  const ratingAverage = hasRating ? Number(input.ratingAverage) : null;
  if (ratingAverage !== null && (!Number.isFinite(ratingAverage) || ratingAverage < 1 || ratingAverage > 5)) {
    return { ok: false, error: "La nota media debe estar entre 1 y 5." };
  }

  const hasCount = input.reviewCount !== null && input.reviewCount !== undefined && input.reviewCount !== "";
  const reviewCount = hasCount ? Number(input.reviewCount) : null;
  if (reviewCount !== null && (!Number.isInteger(reviewCount) || reviewCount < 0)) {
    return { ok: false, error: "El número de reseñas debe ser un entero positivo." };
  }

  return {
    ok: true,
    value: {
      profileUrl: profileUrl.value,
      writeReviewUrl: writeReviewUrl.value,
      ratingAverage: ratingAverage === null ? null : Math.round(ratingAverage * 10) / 10,
      reviewCount
    }
  };
}

/** Recorta al final de una palabra para que la tarjeta no crezca; el texto completo queda en Google. */
export function shortenReview(text: string, maxLength = 280) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return { text: clean, truncated: false };
  const cut = clean.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  return { text: `${(lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`, truncated: true };
}
