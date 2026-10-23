import { describe, expect, it } from "vitest";
import {
  blogReadingMinutes,
  isSafeHttpUrl,
  normalizeBlogSlug,
  validateBlogPostInput
} from "@/lib/blog-shared";

describe("blog", () => {
  it("normaliza títulos en slugs estables", () => {
    expect(normalizeBlogSlug("  Medición láser 3D: Guía práctica  ")).toBe(
      "medicion-laser-3d-guia-practica"
    );
  });

  it("rechaza portadas con protocolos no seguros", () => {
    expect(isSafeHttpUrl("https://example.com/portada.webp")).toBe(true);
    expect(isSafeHttpUrl("javascript:alert(1)")).toBe(false);
  });

  it("valida y limpia un artículo publicable", () => {
    const result = validateBlogPostInput({
      title: "Cómo funciona una nube de puntos 3D",
      slug: "",
      excerpt: "Una explicación clara para entender el resultado de una medición láser 3D.",
      content: "La nube de puntos registra millones de coordenadas del espacio. ".repeat(3),
      coverImageUrl: "https://example.com/cover.jpg",
      category: "Tecnología",
      authorName: "Equipo DATUM",
      isPublished: true
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.slug).toBe("como-funciona-una-nube-de-puntos-3d");
      expect(result.value.isPublished).toBe(true);
    }
  });

  it("calcula un tiempo mínimo de lectura", () => {
    expect(blogReadingMinutes("Texto corto")).toBe(1);
    expect(blogReadingMinutes(Array.from({ length: 420 }, () => "palabra").join(" "))).toBe(2);
  });
});
