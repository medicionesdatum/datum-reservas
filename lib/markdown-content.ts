import { publicPages, servicesForAgents, site } from "@/lib/site-content";

const pageList = publicPages.map((page) => `- [${page.title}](${site.url}${page.path})`).join("\n");
const serviceList = servicesForAgents
  .map((service) => `### ${service.name}\n\n${service.summary}\n\nEntrega: ${service.delivery}.`)
  .join("\n\n");

const commonFooter = `
## Enlaces útiles

${pageList}

## Contacto

- Email: ${site.email}
- Teléfono: ${site.phones[0]}
- Teléfono: ${site.phones[1]}
- Dirección: ${site.address.streetAddress}, ${site.address.addressLocality}, ${site.address.postalCode}
- Horario: ${site.hours.join("; ")}
`;

export function markdownForPath(pathname: string) {
  if (pathname === "/" || pathname === "") {
    return {
      status: 200,
      body: `# ${site.name}

${site.description}

La plataforma permite cotizar y reservar online mediciones láser 3D en Madrid ciudad. El cliente selecciona un servicio, indica la superficie del inmueble, completa las características de representación cuando aplican, elige fecha y hora disponibles, introduce sus datos y paga un depósito mediante Square.

## Servicios

${serviceList}

## Reglas principales de reserva

- Reservas automáticas solo para Madrid ciudad.
- Reserva mínima con 24 horas de anticipación.
- Cambios de fecha o cancelaciones hasta 48 horas antes de la cita.
- Para inmuebles fuera de Madrid ciudad o superiores a 400 m², contactar por correo.

${commonFooter}`
    };
  }

  if (pathname === "/sobre-datum") {
    return {
      status: 200,
      body: `# Sobre DATUM Mediciones

DATUM Mediciones documenta la realidad exacta de inmuebles mediante escaneado láser 3D y documentación técnica para arquitectura, reforma, construcción y análisis inmobiliario. Su trabajo convierte capturas técnicas en nubes de puntos, planos 2D y modelos 3D precisos.

${commonFooter}`
    };
  }

  if (pathname === "/contacto") {
    return {
      status: 200,
      body: `# Contacto DATUM Mediciones

Para consultas sobre mediciones, reservas, inmuebles fuera de Madrid ciudad o presupuestos personalizados, contactar con DATUM por correo o teléfono.

${commonFooter}`
    };
  }

  if (pathname === "/privacidad") {
    return {
      status: 200,
      body: `# Privacidad

La plataforma usa los datos introducidos por el cliente para gestionar reservas, coordinar mediciones, registrar pagos y enviar comunicaciones transaccionales relacionadas con la cita. Los servicios externos detectados son Supabase, Square, Resend y Vercel.

${commonFooter}`
    };
  }

  if (pathname === "/terminos") {
    return {
      status: 200,
      body: `# Términos y condiciones

La reserva automática permite seleccionar servicio, características, fecha y hora, y pagar un depósito. La reserva queda confirmada cuando el pago del depósito se completa y se procesa correctamente.

${commonFooter}`
    };
  }

  if (pathname === "/politica-cancelacion") {
    return {
      status: 200,
      body: `# Política de cambio de fecha y cancelación

Las reservas requieren 24 horas de anticipación. El cliente puede solicitar cambios de fecha o cancelaciones hasta 48 horas antes de la cita. Pasado ese plazo, debe contactar directamente con DATUM.

${commonFooter}`
    };
  }

  if (pathname === "/admin") {
    return {
      status: 403,
      body: `# Portal administrativo privado

El portal administrativo de DATUM no es contenido público. Para información pública, consulta:

${pageList}`
    };
  }

  return {
    status: 404,
    body: `# Página no encontrada

La URL solicitada no existe. Consulta estas páginas públicas:

${pageList}

También puedes revisar:

- Sitemap: ${site.url}/sitemap.xml
- Guía para agentes: ${site.url}/llms.txt
`
  };
}
