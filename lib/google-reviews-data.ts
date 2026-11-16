import { getSupabaseAdmin } from "@/lib/supabase";
import type { GoogleReview, GoogleReviewsSettings } from "@/lib/google-reviews";

/** Reseñas visibles y datos de la ficha para la web pública; si algo falla, la sección simplemente no se muestra. */
export async function getPublicGoogleReviews(): Promise<{ reviews: GoogleReview[]; settings: GoogleReviewsSettings | null }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { reviews: [], settings: null };

  const [reviewsResult, settingsResult] = await Promise.all([
    supabase
      .from("google_reviews")
      .select("*")
      .eq("is_visible", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(12),
    supabase.from("google_reviews_settings").select("*").eq("id", 1).maybeSingle()
  ]);

  return {
    reviews: reviewsResult.error ? [] : ((reviewsResult.data ?? []) as GoogleReview[]),
    settings: settingsResult.error ? null : ((settingsResult.data ?? null) as GoogleReviewsSettings | null)
  };
}
