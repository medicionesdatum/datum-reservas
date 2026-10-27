import { cache } from "react";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { BlogPost } from "@/lib/blog-shared";

const publicBlogColumns = [
  "id",
  "created_at",
  "updated_at",
  "title",
  "slug",
  "excerpt",
  "content",
  "cover_image_url",
  "category",
  "author_name",
  "is_published",
  "published_at"
].join(",");

export async function getPublishedBlogPosts(limit?: number): Promise<BlogPost[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  let query = supabase
    .from("blog_posts")
    .select(publicBlogColumns)
    .eq("is_published", true)
    .not("published_at", "is", null)
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false });

  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) return [];
  return (data ?? []) as unknown as BlogPost[];
}

export const getPublishedBlogPost = cache(async function getPublishedBlogPost(slug: string): Promise<BlogPost | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("blog_posts")
    .select(publicBlogColumns)
    .eq("slug", slug)
    .eq("is_published", true)
    .not("published_at", "is", null)
    .lte("published_at", new Date().toISOString())
    .maybeSingle();

  if (error || !data) return null;
  return data as unknown as BlogPost;
});

export function blogCoverStyle(url?: string | null) {
  if (!url) return undefined;

  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return undefined;
    return {
      backgroundImage: `linear-gradient(180deg, rgba(3, 12, 24, 0.05), rgba(3, 12, 24, 0.5)), url(${JSON.stringify(parsed.toString())})`,
      backgroundSize: "cover",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center"
    };
  } catch {
    return undefined;
  }
}
