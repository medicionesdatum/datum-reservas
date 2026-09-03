export const site = {
  name: "DATUM Mediciones",
  legalName: "DOGROUP STUDIO SL.",
  url: "https://medicionesdatum.es",
  description:
    "DATUM documenta la realidad exacta de inmuebles mediante escaneado láser 3D, nubes de puntos, planos 2D y modelos 3D precisos para proyectar, reformar, construir o analizar con una base técnica fiable.",
  email: "info@medicionesdatum.es",
  phones: ["+34 613 676 524", "+34 915 271 501"],
  address: {
    streetAddress: "Calle de Tarragona 20",
    addressLocality: "Madrid",
    postalCode: "28045",
    addressRegion: "Madrid",
    addressCountry: "ES"
  },
  sameAs: [
    "https://www.linkedin.com/company/medicionesdatum/",
    "https://www.instagram.com/datum.mediciones"
  ],
  hours: [
    "Lunes a jueves: 08:30-17:00",
    "Viernes: 08:30-14:00"
  ]
} as const;

export const publicPages = [
  {
    path: "/",
    title: "Reservas DATUM",
    description: "Cotización y reserva online de mediciones láser 3D."
  },
  {
    path: "/sobre-datum",
    title: "Sobre DATUM",
    description: "Quiénes somos y cómo trabaja DATUM Mediciones."
  },
  {
    path: "/contacto",
    title: "Contacto",
    description: "Datos de contacto y atención de DATUM Mediciones."
  },
  {
    path: "/privacidad",
    title: "Privacidad",
    description: "Información básica sobre el tratamiento de datos personales."
  },
  {
    path: "/terminos",
    title: "Términos y condiciones",
    description: "Condiciones de uso de la plataforma de reservas."
  },
  {
    path: "/politica-cancelacion",
    title: "Política de cancelación",
    description: "Cambios de fecha, cancelaciones y coordinación de visitas."
  }
] as const;

export const servicesForAgents = [
  {
    name: "Nube de Puntos 3D",
    summary:
      "Nube de puntos sin procesar en formato E57 universal y RCP Recap, compatible con Revit y AutoCAD. Ideal para estudios que modelan internamente.",
    delivery: "1-2 días hábiles"
  },
  {
    name: "Planos 2D Estado Actual",
    summary:
      "Nube de puntos E57 y RCP, plantas acotadas con superficies por estancia, secciones y alzados. Entrega en DXF/DWG editable y PDF.",
    delivery: "2-3 días hábiles"
  },
  {
    name: "Modelo 3D Revit",
    summary:
      "Nube de puntos E57 y RCP, modelo 3D en Revit con elementos medidos, áreas y volúmenes. Entrega en RVT/IFC, DXF/DWG y PDF.",
    delivery: "3-5 días hábiles"
  }
] as const;

export function absoluteUrl(path = "/") {
  return `${site.url}${path}`;
}
