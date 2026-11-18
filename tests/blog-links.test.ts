import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getPublishedBlogPosts = vi.fn();

vi.mock("@/lib/blog", () => ({
  getPublishedBlogPosts: (...args: unknown[]) => getPublishedBlogPosts(...args)
}));

import { BlogLinks } from "@/components/BlogLinks";

const post = (n: number) => ({
  id: `id-${n}`,
  slug: `articulo-${n}`,
  title: `Artículo ${n}`,
  excerpt: `Resumen ${n}`,
  category: "Guías"
});

describe("BlogLinks", () => {
  beforeEach(() => getPublishedBlogPosts.mockReset());

  it("enlaza los últimos artículos y el índice del blog", async () => {
    getPublishedBlogPosts.mockResolvedValue([post(1), post(2), post(3)]);
    const html = renderToStaticMarkup(await BlogLinks());

    expect(getPublishedBlogPosts).toHaveBeenCalledWith(3);
    for (const n of [1, 2, 3]) {
      expect(html).toContain(`href="/blog/articulo-${n}"`);
      expect(html).toContain(`Artículo ${n}`);
    }
    expect(html).toContain('href="/blog"');
  });

  it("no muestra nada si no hay artículos publicados", async () => {
    getPublishedBlogPosts.mockResolvedValue([]);
    expect(await BlogLinks()).toBeNull();
  });
});
