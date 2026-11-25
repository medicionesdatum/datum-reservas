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

/** Nodo de negocio local con la misma @id que la organización de la home (datos ya publicados). */
export function localBusinessNode() {
  return {
    "@type": "ProfessionalService",
    "@id": organizationId,
    name: site.name,
    url: site.url,
    email: site.email,
    telephone: site.phones,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.streetAddress,
      addressLocality: site.address.addressLocality,
      postalCode: site.address.postalCode,
      addressRegion: site.address.addressRegion,
      addressCountry: site.address.addressCountry
    },
    geo: { "@type": "GeoCoordinates", latitude: 40.401473, longitude: -3.696485 },
    areaServed: { "@type": "City", name: "Madrid" },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday"],
        opens: "08:30",
        closes: "17:00"
      },
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Friday", opens: "08:30", closes: "14:30" }
    ]
  };
}

/**
 * Datos estructurados de una página de contenido (sin precios, sin valoraciones):
 * WebPage con autor Organization y dateModified, negocio local, Service, FAQPage con las
 * preguntas visibles y, opcionalmente, HowTo. Las migas de pan las añade PublicInfoPage.
 */
export function landingPageJsonLd(params: {
  path: string;
  name: string;
  description: string;
  dateModified: string;
  service: { name: string; description: string };
  faq: readonly { question: string; answer: string }[];
  howTo?: { name: string; steps: readonly { name: string; text: string }[] };
}) {
  const url = absoluteUrl(params.path);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: params.name,
        description: params.description,
        inLanguage: "es-ES",
        isPartOf: { "@id": websiteId },
        about: { "@id": organizationId },
        author: { "@type": "Organization", "@id": organizationId, name: site.name },
        dateModified: params.dateModified
      },
      localBusinessNode(),
      {
        "@type": "Service",
        "@id": `${url}#service`,
        name: params.service.name,
        serviceType: params.service.name,
        description: params.service.description,
        url,
        provider: { "@id": organizationId },
        areaServed: { "@type": "City", name: "Madrid" }
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: params.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer }
        }))
      },
      ...(params.howTo
        ? [
            {
              "@type": "HowTo",
              "@id": `${url}#howto`,
              name: params.howTo.name,
              step: params.howTo.steps.map((step, index) => ({
                "@type": "HowToStep",
                position: index + 1,
                name: step.name,
                text: step.text,
                url: `${url}#paso-${index + 1}`
              }))
            }
          ]
        : [])
    ]
  };
}
