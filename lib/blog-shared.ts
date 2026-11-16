export type BlogPost = {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image_url?: string | null;
  category: string;
  author_name: string;
  is_published: boolean;
  published_at?: string | null;
};

export type BlogPostInput = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string | null;
  category: string;
  authorName: string;
  isPublished: boolean;
  /** Fecha ISO futura en la que el artículo pasa a ser visible; null = al guardar. */
  publishAt: string | null;
};

const MAX_SCHEDULE_AHEAD_MS = 366 * 24 * 60 * 60 * 1000;

/** Acepta solo ISO 8601 con zona horaria ("Z" o ±hh:mm) para que la hora programada no sea ambigua. */
export function parsePublishAt(value: unknown, now = new Date()):
  | { ok: true; value: string | null }
  | { ok: false; error: string } {
  if (value === undefined || value === null || value === "") return { ok: true, value: null };
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/.test(value)) {
    return { ok: false, error: "La fecha de publicación debe ser ISO con zona horaria, por ejemplo 2026-11-20T09:00:00+01:00." };
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { ok: false, error: "La fecha de publicación no es válida." };
  }
  if (date.getTime() - now.getTime() > MAX_SCHEDULE_AHEAD_MS) {
    return { ok: false, error: "La fecha de publicación no puede superar un año." };
  }
  return { ok: true, value: date.toISOString() };
}

export function normalizeBlogSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function isSafeHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function blogReadingMinutes(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 210));
}

export function validateBlogPostInput(body: unknown):
  | { ok: true; value: BlogPostInput }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Los datos del artículo no son válidos." };
  }

  const input = body as Record<string, unknown>;
  const title = readText(input.title, 160);
  const slug = normalizeBlogSlug(readText(input.slug, 120) || title);
  const excerpt = readText(input.excerpt, 500);
  const content = readText(input.content, 60000);
  const category = readText(input.category, 80) || "Innovación";
  const authorName = readText(input.authorName, 120) || "Equipo DATUM";
  const coverImageUrl = readText(input.coverImageUrl, 2000);

  if (title.length < 5) {
    return { ok: false, error: "El título debe tener al menos 5 caracteres." };
  }
  if (slug.length < 3) {
    return { ok: false, error: "La URL del artículo no es válida." };
  }
  if (excerpt.length < 20) {
    return { ok: false, error: "El resumen debe tener al menos 20 caracteres." };
  }
  if (content.length < 80) {
    return { ok: false, error: "El contenido debe tener al menos 80 caracteres." };
  }
  if (coverImageUrl && !isSafeHttpUrl(coverImageUrl)) {
    return { ok: false, error: "La imagen de portada debe usar una URL http o https." };
  }
  if (typeof input.isPublished !== "boolean") {
    return { ok: false, error: "Indica si el artículo se publica o queda como borrador." };
  }
  const publishAt = parsePublishAt(input.publishAt);
  if (!publishAt.ok) return publishAt;
  if (publishAt.value && !input.isPublished) {
    return { ok: false, error: "Para programar un artículo hay que marcarlo como publicado." };
  }

  return {
    ok: true,
    value: {
      title,
      slug,
      excerpt,
      content,
      coverImageUrl: coverImageUrl || null,
      category,
      authorName,
      isPublished: input.isPublished,
      publishAt: publishAt.value
    }
  };
}

function readText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}
