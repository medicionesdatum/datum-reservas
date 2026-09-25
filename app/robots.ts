import type { MetadataRoute } from "next";
import { absoluteUrl, site } from "@/lib/site-content";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/"]
      },
      {
        userAgent: [
          "GPTBot",
          "ClaudeBot",
          "Claude-User",
          "Claude-SearchBot",
          "Google-Extended",
          "ChatGPT-User",
          "OAI-SearchBot",
          "PerplexityBot",
          "Amazonbot",
          "Applebot-Extended",
          "meta-externalagent",
          "Bytespider",
          "CCBot"
        ],
        allow: "/",
        disallow: ["/admin", "/api/"]
      }
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: site.url
  };
}
