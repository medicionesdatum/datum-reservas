import type { MetadataRoute } from "next";
import { getPublishedBlogPosts } from "@/lib/blog";
import { absoluteUrl, publicPages } from "@/lib/site-content";

export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPublishedBlogPosts();
  const pages: MetadataRoute.Sitemap = publicPages.map((page) => ({
    url: absoluteUrl(page.path),
    lastModified: new Date("2026-10-23"),
    changeFrequency: page.path === "/" || page.path === "/blog" ? "weekly" : "monthly",
    priority: page.path === "/" ? 1 : page.path === "/blog" ? 0.8 : 0.7
  }));

  return [
    ...pages,
    ...posts.map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: new Date(post.updated_at),
      changeFrequency: "monthly" as const,
      priority: 0.7,
      images: post.cover_image_url ? [post.cover_image_url] : undefined
    }))
  ];
}
