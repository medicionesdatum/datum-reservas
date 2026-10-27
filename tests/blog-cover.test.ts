import { describe, expect, it } from "vitest";
import { blogCoverStyle } from "@/lib/blog";

describe("blogCoverStyle", () => {
  it("muestra la portada una sola vez, entera y centrada", () => {
    const style = blogCoverStyle("https://example.com/portada.jpg");
    expect(style?.backgroundImage).toContain('url("https://example.com/portada.jpg")');
    expect(style).toMatchObject({
      backgroundSize: "contain",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center"
    });
  });

  it("no devuelve estilo sin portada o con una URL no válida", () => {
    expect(blogCoverStyle(null)).toBeUndefined();
    expect(blogCoverStyle("javascript:alert(1)")).toBeUndefined();
    expect(blogCoverStyle("no es una url")).toBeUndefined();
  });
});
