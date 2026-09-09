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
    path: "/servicios",
    title: "Información y servicios",
    description:
      "Servicios, proceso, especificaciones técnicas y preguntas frecuentes de DATUM Mediciones."
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

export const serviceDetails = [
  {
    id: "point-cloud",
    name: "Nube de Puntos 3D",
    summary:
      "Procesamos la captura realizada con Leica BLK2GO para obtener una nube de puntos precisa y trazable. Es la opción adecuada cuando tu equipo modela internamente y necesita una base fiable del estado real.",
    formats: "E57 · RCP",
    delivery: "1-2 días hábiles",
    scope:
      "Incluye el registro y procesado de la captura. No incluye planos 2D ni modelo 3D."
  },
  {
    id: "plans-2d",
    name: "Planos 2D Estado Actual",
    summary:
      "Delineamos plantas acotadas con superficies por estancia, secciones y alzados de fachada. Está pensado para proyectos, licencias y reformas que necesitan documentación fiable del estado actual.",
    formats: "E57 · RCP · DXF/DWG · PDF",
    delivery: "2-3 días hábiles",
    scope:
      "Incluye la nube de puntos, una planta, una sección y un alzado de fachada. Se pueden añadir representaciones adicionales durante la reserva."
  },
  {
    id: "revit-3d",
    name: "Modelo 3D Revit",
    summary:
      "Creamos un modelo 3D en Revit con elementos medidos, áreas y volúmenes, listo para trabajar sobre una base digital del inmueble existente.",
    formats: "E57 · RCP · RVT/IFC · DXF/DWG · PDF",
    delivery: "3-5 días hábiles",
    scope:
      "Incluye los elementos constructivos visibles para el escáner. No incluye instalaciones empotradas ni elementos ocultos."
  }
] as const;

export const faqItems = [
  {
    question: "¿Qué incluye una medición con DATUM?",
    answer:
      "Escaneamos el inmueble completo con tecnología láser 3D Leica BLK2GO y entregamos la nube de puntos en formatos E57 y RCP. Según el servicio elegido, también incluimos planos 2D en DXF/DWG y PDF o un modelo 3D en Revit."
  },
  {
    question: "¿Cuánto tarda una medición?",
    answer:
      "La visita de escaneado suele completarse en poco tiempo y está planteada para interferir lo mínimo posible en la actividad del espacio. La nube de puntos se entrega en 1-2 días hábiles, los planos 2D en 2-3 días hábiles y el modelo 3D completo en 3-5 días hábiles."
  },
  {
    question: "¿Necesito estar presente durante el escaneado?",
    answer:
      "No es imprescindible, pero necesitamos que una persona pueda facilitar el acceso al inmueble y resolver dudas puntuales durante la visita."
  },
  {
    question: "¿En qué formatos se entrega la documentación?",
    answer:
      "Entregamos la nube de puntos en E57 y RCP, compatibles con Revit y AutoCAD; los planos en DXF/DWG editable y PDF; y los modelos 3D en RVT/IFC, además de DXF/DWG y PDF, según el servicio contratado."
  },
  {
    question: "¿DATUM trabaja fuera de Madrid ciudad?",
    answer:
      "Sí. Los inmuebles fuera de Madrid ciudad se valoran mediante un presupuesto personalizado. Puedes escribirnos a info@medicionesdatum.es con la dirección, la superficie aproximada y el servicio que necesitas."
  },
  {
    question: "¿Qué precisión tiene el escaneado?",
    answer:
      "El Leica BLK2GO ofrece en interiores una precisión aproximada de ±10 mm, adecuada para documentar el estado actual de inmuebles, preparar proyectos, tramitar licencias y planificar reformas."
  }
] as const;

export function absoluteUrl(path = "/") {
  return `${site.url}${path}`;
}
