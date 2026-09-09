import type { MetadataRoute } from "next";
import { absoluteUrl, publicPages } from "@/lib/site-content";

export default function sitemap(): MetadataRoute.Sitemap {
  return publicPages.map((page) => ({
    url: absoluteUrl(page.path),
    lastModified: new Date("2026-09-09"),
    changeFrequency: page.path === "/" ? "weekly" : "monthly",
    priority: page.path === "/" ? 1 : 0.7
  }));
}
