import BookingFlow from "@/components/BookingFlow";
import { site, servicesForAgents } from "@/lib/site-content";

export default function Home() {
  const organizationId = `${site.url}/#organization`;
  const websiteId = `${site.url}/#website`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Organization", "LocalBusiness"],
        "@id": organizationId,
        name: site.name,
        legalName: site.legalName,
        url: site.url,
        logo: {
          "@type": "ImageObject",
          url: `${site.url}/assets/datum-logo.png`,
          width: 1200,
          height: 300
        },
        image: `${site.url}/assets/datum-hero.jpg`,
        description: site.description,
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
        areaServed: {
          "@type": "City",
          name: "Madrid"
        },
        sameAs: site.sameAs,
        openingHoursSpecification: [
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday"],
            opens: "08:30",
            closes: "17:00"
          },
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: "Friday",
            opens: "08:30",
            closes: "14:00"
          }
        ],
        makesOffer: servicesForAgents.map((service) => ({
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: service.name,
            description: service.summary
          }
        }))
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: `${site.url}/`,
        name: site.name,
        description: site.description,
        inLanguage: "es-ES",
        publisher: {
          "@id": organizationId
        }
      }
    ]
  };

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c")
        }}
        type="application/ld+json"
      />
      <BookingFlow />
      <section className="sr-only" aria-label="Resumen de DATUM Mediciones">
        <h2>DATUM Mediciones: medición y documentación técnica</h2>
        <p>{site.description}</p>
        <p>
          La plataforma permite cotizar y reservar mediciones láser 3D en Madrid
          ciudad, seleccionar servicio, indicar superficie, elegir fecha y hora,
          completar datos de contacto y pagar un depósito mediante Square.
        </p>
        <p>
          Los servicios disponibles son Nube de Puntos 3D, Planos 2D Estado
          Actual y Modelo 3D Revit. Para inmuebles fuera de Madrid ciudad o
          superficies superiores a 400 m², el usuario debe contactar con DATUM
          para recibir una propuesta personalizada.
        </p>
      </section>
    </>
  );
}
