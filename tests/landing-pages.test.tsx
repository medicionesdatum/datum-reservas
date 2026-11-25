import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import HowWeWorkPage, { metadata as howMetadata } from "@/app/como-trabajamos/page";
import LaserScanningMadridPage, { metadata as scanMetadata } from "@/app/escaneado-laser-madrid/page";
import { publicPages } from "@/lib/site-content";
import { landingPageJsonLd } from "@/lib/structured-data";

const pages = [
  { name: "/escaneado-laser-madrid", Page: LaserScanningMadridPage, metadata: scanMetadata },
  { name: "/como-trabajamos", Page: HowWeWorkPage, metadata: howMetadata }
];

function jsonLdBlocks(html: string) {
  return [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((m) =>
    JSON.parse(m[1].replace(/\\u003c/g, "<"))
  );
}

describe.each(pages)("página $name", ({ name, Page, metadata }) => {
  const html = renderToStaticMarkup(<Page />);
  const text = html
    .replace(/<script.*?<\/script>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ");

  it("tiene title de hasta 60 caracteres, descripción y canonical propia", () => {
    const title = (metadata.title as { absolute: string }).absolute;
    expect(title.length).toBeLessThanOrEqual(60);
    expect(metadata.description?.length).toBeGreaterThan(100);
    expect(String(metadata.alternates?.canonical)).toBe(`https://medicionesdatum.es${name}`);
  });

  it("una sola H1, fecha visible y autor", () => {
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(text).toContain("Actualizado: noviembre 2026");
    expect(text).toContain("Autor: Equipo de DATUM");
  });

  it("sin la palabra BIM, sin euros y sin valoraciones ni organización matriz en el marcado", () => {
    expect(text).not.toMatch(/\bBIM\b/i);
    expect(text).not.toMatch(/€|euros/i);
    const ld = JSON.stringify(jsonLdBlocks(html));
    expect(ld).not.toMatch(/aggregateRating|parentOrganization|\bBIM\b|€/);
    expect(ld).toContain("dateModified");
    expect(ld).toContain("40.401473");
  });

  it("el FAQPage solo contiene preguntas visibles", () => {
    const faq = jsonLdBlocks(html).flatMap((b) => b["@graph"] ?? []).find((n) => n["@type"] === "FAQPage");
    expect(faq.mainEntity.length).toBeGreaterThan(0);
    for (const q of faq.mainEntity) expect(text).toContain(q.name);
  });

  it("está en el sitemap y enlaza a /servicios", () => {
    expect(publicPages.some((p) => p.path === name)).toBe(true);
    expect(html).toContain('href="/servicios"');
  });
});

describe("enlaces y datos estructurados", () => {
  it("las páginas se enlazan entre sí y la política de cancelación existe", () => {
    const scan = renderToStaticMarkup(<LaserScanningMadridPage />);
    const how = renderToStaticMarkup(<HowWeWorkPage />);
    expect(scan).toContain('href="/como-trabajamos"');
    expect(how).toContain('href="/escaneado-laser-madrid"');
    expect(how).toContain('href="/politica-cancelacion"');
  });

  it("HowTo de /como-trabajamos con 5 pasos", () => {
    const html = renderToStaticMarkup(<HowWeWorkPage />);
    const howTo = jsonLdBlocks(html).flatMap((b) => b["@graph"] ?? []).find((n) => n["@type"] === "HowTo");
    expect(howTo.step).toHaveLength(5);
  });

  it("landingPageJsonLd no añade HowTo si no se pide", () => {
    const data = landingPageJsonLd({
      path: "/x",
      name: "X",
      description: "d",
      dateModified: "2026-11-25",
      service: { name: "s", description: "d" },
      faq: [{ question: "q", answer: "a" }]
    });
    expect(data["@graph"].map((n) => n["@type"])).toEqual(["WebPage", "ProfessionalService", "Service", "FAQPage"]);
  });
});
