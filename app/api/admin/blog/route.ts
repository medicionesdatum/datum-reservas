import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { validateBlogPostInput } from "@/lib/blog-shared";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "La base de datos no está configurada." }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ blogPosts: data ?? [] });
}

export async function POST(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const parsed = validateBlogPostInput(await request.json());
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "La base de datos no está configurada." }, { status: 503 });
  }

  const input = parsed.value;
  const { data, error } = await supabase
    .from("blog_posts")
    .insert({
      title: input.title,
      slug: input.slug,
      excerpt: input.excerpt,
      content: input.content,
      cover_image_url: input.coverImageUrl,
      category: input.category,
      author_name: input.authorName,
      is_published: input.isPublished,
      published_at: input.isPublished ? new Date().toISOString() : null
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: blogErrorMessage(error.code, error.message) }, { status: 400 });
  }

  refreshBlogPaths(data.slug);
  return NextResponse.json({ blogPost: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  if (typeof body.id !== "string" || !/^[0-9a-f-]{36}$/i.test(body.id)) {
    return NextResponse.json({ error: "Falta un artículo válido." }, { status: 400 });
  }

  const parsed = validateBlogPostInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "La base de datos no está configurada." }, { status: 503 });
  }

  const { data: current, error: currentError } = await supabase
    .from("blog_posts")
    .select("slug,published_at")
    .eq("id", body.id)
    .maybeSingle();

  if (currentError || !current) {
    return NextResponse.json({ error: "No se encontró el artículo." }, { status: 404 });
  }

  const input = parsed.value;
  const { data, error } = await supabase
    .from("blog_posts")
    .update({
      title: input.title,
      slug: input.slug,
      excerpt: input.excerpt,
      content: input.content,
      cover_image_url: input.coverImageUrl,
      category: input.category,
      author_name: input.authorName,
      is_published: input.isPublished,
      published_at: input.isPublished ? current.published_at ?? new Date().toISOString() : null
    })
    .eq("id", body.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: blogErrorMessage(error.code, error.message) }, { status: 400 });
  }

  refreshBlogPaths(current.slug);
  refreshBlogPaths(data.slug);
  return NextResponse.json({ blogPost: data });
}

export async function DELETE(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Falta un artículo válido." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "La base de datos no está configurada." }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("blog_posts")
    .delete()
    .eq("id", id)
    .select("slug")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "No se encontró el artículo." }, { status: 404 });
  }

  refreshBlogPaths(data.slug);
  return NextResponse.json({ ok: true });
}

function refreshBlogPaths(slug: string) {
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/sitemap.xml");
}

function blogErrorMessage(code?: string, message?: string) {
  if (code === "23505") return "Ya existe un artículo con esa dirección.";
  return message || "No se pudo guardar el artículo.";
}
