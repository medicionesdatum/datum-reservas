import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { validateGoogleReviewInput, validateGoogleReviewsSettings } from "@/lib/google-reviews";
import { getSupabaseAdmin } from "@/lib/supabase";

// Códigos de Postgres/PostgREST cuando la migración de reseñas aún no se ha ejecutado.
const missingTableCodes = new Set(["42P01", "PGRST205"]);

function unauthorized() {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}

function noDatabase() {
  return NextResponse.json({ error: "La base de datos no está configurada." }, { status: 503 });
}

function refreshPublicPages() {
  revalidatePath("/servicios");
}

function tableError(error: { code?: string; message: string }) {
  if (error.code && missingTableCodes.has(error.code)) {
    return NextResponse.json({ error: "Falta ejecutar la migración de reseñas en Supabase." }, { status: 503 });
  }
  return NextResponse.json({ error: error.message }, { status: 500 });
}

export async function GET(request: Request) {
  if (!(await isAdminAuthorized(request))) return unauthorized();
  const supabase = getSupabaseAdmin();
  if (!supabase) return noDatabase();

  const [reviews, settings] = await Promise.all([
    supabase.from("google_reviews").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: false }),
    supabase.from("google_reviews_settings").select("*").eq("id", 1).maybeSingle()
  ]);
  if (reviews.error) return tableError(reviews.error);
  if (settings.error) return tableError(settings.error);

  return NextResponse.json({ reviews: reviews.data ?? [], settings: settings.data ?? null });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthorized(request))) return unauthorized();
  const parsed = validateGoogleReviewInput(await request.json());
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return noDatabase();

  // La reseña nueva va la primera: se coloca antes que la que ahora tiene el menor orden.
  const { data: first } = await supabase
    .from("google_reviews")
    .select("sort_order")
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  const input = parsed.value;
  const { data, error } = await supabase
    .from("google_reviews")
    .insert({
      author_name: input.authorName,
      review_text: input.reviewText,
      rating: input.rating,
      review_label: input.reviewLabel,
      is_visible: input.isVisible,
      sort_order: (first?.sort_order ?? 1) - 1
    })
    .select("*")
    .single();
  if (error) return tableError(error);

  refreshPublicPages();
  return NextResponse.json({ review: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!(await isAdminAuthorized(request))) return unauthorized();
  const body = await request.json();
  if (typeof body.id !== "string" || !/^[0-9a-f-]{36}$/i.test(body.id)) {
    return NextResponse.json({ error: "Falta una reseña válida." }, { status: 400 });
  }
  const supabase = getSupabaseAdmin();
  if (!supabase) return noDatabase();

  // Reordenar: intercambia el orden con la reseña vecina.
  if (body.move === "up" || body.move === "down") {
    const { data: all, error: listError } = await supabase
      .from("google_reviews")
      .select("id,sort_order,created_at")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (listError) return tableError(listError);
    const ordered = all ?? [];
    const index = ordered.findIndex((review) => review.id === body.id);
    const target = body.move === "up" ? index - 1 : index + 1;
    if (index < 0) return NextResponse.json({ error: "No se encontró la reseña." }, { status: 404 });
    if (target < 0 || target >= ordered.length) return NextResponse.json({ ok: true });

    const reordered = [...ordered];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    const results = await Promise.all(
      reordered.map((review, position) =>
        supabase.from("google_reviews").update({ sort_order: position }).eq("id", review.id)
      )
    );
    const failed = results.find((result) => result.error);
    if (failed?.error) return tableError(failed.error);

    refreshPublicPages();
    return NextResponse.json({ ok: true });
  }

  const parsed = validateGoogleReviewInput(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const input = parsed.value;
  const { data, error } = await supabase
    .from("google_reviews")
    .update({
      author_name: input.authorName,
      review_text: input.reviewText,
      rating: input.rating,
      review_label: input.reviewLabel,
      is_visible: input.isVisible
    })
    .eq("id", body.id)
    .select("*")
    .maybeSingle();
  if (error) return tableError(error);
  if (!data) return NextResponse.json({ error: "No se encontró la reseña." }, { status: 404 });

  refreshPublicPages();
  return NextResponse.json({ review: data });
}

/** Guarda los datos de la ficha de Google (enlaces, nota media y número de reseñas). */
export async function PUT(request: Request) {
  if (!(await isAdminAuthorized(request))) return unauthorized();
  const parsed = validateGoogleReviewsSettings(await request.json());
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return noDatabase();

  const input = parsed.value;
  const { data, error } = await supabase
    .from("google_reviews_settings")
    .upsert({
      id: 1,
      profile_url: input.profileUrl,
      write_review_url: input.writeReviewUrl,
      rating_average: input.ratingAverage,
      review_count: input.reviewCount
    })
    .select("*")
    .single();
  if (error) return tableError(error);

  refreshPublicPages();
  return NextResponse.json({ settings: data });
}

export async function DELETE(request: Request) {
  if (!(await isAdminAuthorized(request))) return unauthorized();
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Falta una reseña válida." }, { status: 400 });
  }
  const supabase = getSupabaseAdmin();
  if (!supabase) return noDatabase();

  const { data, error } = await supabase.from("google_reviews").delete().eq("id", id).select("id").maybeSingle();
  if (error) return tableError(error);
  if (!data) return NextResponse.json({ error: "No se encontró la reseña." }, { status: 404 });

  refreshPublicPages();
  return NextResponse.json({ ok: true });
}
