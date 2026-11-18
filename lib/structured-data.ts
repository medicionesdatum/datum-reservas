import { absoluteUrl, site } from "@/lib/site-content";

export const organizationId = `${site.url}/#organization`;
export const websiteId = `${site.url}/#website`;

/** Serializa JSON-LD para incrustarlo en un <script>, evitando que un "<" cierre la etiqueta. */
export function serializeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** Migas de pan: "Inicio" siempre es el primer elemento; `items` son los siguientes niveles. */
export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: absoluteUrl("/") },
      ...items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 2,
        name: item.name,
        item: absoluteUrl(item.path)
      }))
    ]
  };
}

/** Un punto de contacto por teléfono, con el correo común. Usa solo datos ya publicados en la web. */
export function contactPointsJsonLd() {
  return site.phones.map((telephone) => ({
    "@type": "ContactPoint",
    contactType: "customer service",
    telephone,
    email: site.email,
    areaServed: "ES",
    availableLanguage: "es"
  }));
}

export function aboutPageJsonLd(params: { path: string; name: string; description: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    url: absoluteUrl(params.path),
    name: params.name,
    description: params.description,
    inLanguage: "es-ES",
    isPartOf: { "@id": websiteId },
    about: { "@id": organizationId }
  };
}

/**
 * `fromPrices` (opcional) es el precio "desde" sin IVA por id de servicio. Si se pasa,
 * cada Service incluye un Offer con priceSpecification (importe mínimo, IVA no incluido).
 */
export function servicesJsonLd(
  services: readonly { id: string; name: string; summary: string }[],
  fromPrices?: Readonly<Record<string, number>>
) {
  return {
    "@context": "https://schema.org",
    "@graph": services.map((service) => {
      const fromPrice = fromPrices?.[service.id];
      return {
        "@type": "Service",
        "@id": `${absoluteUrl("/servicios")}#${service.id}`,
        url: `${absoluteUrl("/servicios")}#${service.id}`,
        name: service.name,
        serviceType: service.name,
        description: service.summary,
        provider: { "@id": organizationId },
        areaServed: { "@type": "City", name: "Madrid" },
        ...(fromPrice === undefined
          ? {}
          : {
              offers: {
                "@type": "Offer",
                url: absoluteUrl("/#reserva"),
                priceCurrency: "EUR",
                eligibleRegion: { "@type": "City", name: "Madrid" },
                priceSpecification: {
                  "@type": "PriceSpecification",
                  minPrice: fromPrice,
                  priceCurrency: "EUR",
                  valueAddedTaxIncluded: false
                }
              }
            })
      };
    })
  };
}
