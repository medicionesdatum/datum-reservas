import { describe, expect, it } from "vitest";
import { serviceDetails, site } from "@/lib/site-content";
import {
  aboutPageJsonLd,
  breadcrumbJsonLd,
  contactPointsJsonLd,
  organizationId,
  serializeJsonLd,
  servicesJsonLd
} from "@/lib/structured-data";

describe("serializeJsonLd", () => {
  it("escapa el signo < para que no cierre el script", () => {
    expect(serializeJsonLd({ a: "</script><b>" })).not.toContain("<");
  });
});

describe("sameAs de la organización", () => {
  it("incluye la ficha de Google junto a las redes sociales", () => {
    expect(site.sameAs).toContain("https://maps.app.goo.gl/TPdNU1ojywR3xpkq5");
    expect(site.sameAs.every((url) => url.startsWith("https://"))).toBe(true);
  });
});

describe("breadcrumbJsonLd", () => {
  it("empieza en Inicio y numera los niveles siguientes", () => {
    const data = breadcrumbJsonLd([
      { name: "Blog", path: "/blog" },
      { name: "Artículo", path: "/blog/articulo" }
    ]);
    expect(data["@type"]).toBe("BreadcrumbList");
    expect(data.itemListElement.map((item) => [item.position, item.name, item.item])).toEqual([
      [1, "Inicio", "https://medicionesdatum.es/"],
      [2, "Blog", "https://medicionesdatum.es/blog"],
      [3, "Artículo", "https://medicionesdatum.es/blog/articulo"]
    ]);
  });
});

describe("contactPointsJsonLd", () => {
  it("usa solo el correo y los teléfonos ya publicados", () => {
    const points = contactPointsJsonLd();
    expect(points.map((point) => point.telephone)).toEqual([...site.phones]);
    expect(points.every((point) => point.email === site.email)).toBe(true);
  });
});

describe("aboutPageJsonLd y servicesJsonLd", () => {
  it("AboutPage apunta a la organización de la home", () => {
    const data = aboutPageJsonLd({ path: "/sobre-datum", name: "Sobre DATUM", description: "x" });
    expect(data["@type"]).toBe("AboutPage");
    expect(data.about).toEqual({ "@id": organizationId });
  });

  it("genera un Service por servicio sin precios ni valoraciones", () => {
    const data = servicesJsonLd(serviceDetails);
    expect(data["@graph"]).toHaveLength(serviceDetails.length);
    const serialized = JSON.stringify(data);
    expect(serialized).not.toContain("aggregateRating");
    expect(serialized).not.toContain("offers");
    expect(data["@graph"][0]["@id"]).toBe("https://medicionesdatum.es/servicios#point-cloud");
  });
});
