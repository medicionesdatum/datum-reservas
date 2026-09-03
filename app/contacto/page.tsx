import type { Metadata } from "next";
import { PublicInfoPage } from "@/components/PublicInfoPage";
import { absoluteUrl, site } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Contacto, dirección y horario de atención de DATUM Mediciones.",
  alternates: {
    canonical: absoluteUrl("/contacto")
  }
};

export default function ContactPage() {
  return (
    <PublicInfoPage eyebrow="Contacto" title="Contactar con DATUM">
      <p>
        Para consultas sobre mediciones láser 3D, nubes de puntos, planos 2D,
        modelos 3D Revit, reservas ya realizadas o solicitudes fuera de Madrid
        ciudad, puedes contactar con DATUM Mediciones por correo electrónico o
        teléfono. La plataforma online permite reservar automáticamente
        mediciones dentro de Madrid ciudad, pero cualquier caso especial puede
        revisarse de forma personalizada.
      </p>
      <p>
        Correo electrónico:
        {" "}
        <a className="text-datum-cyan" href={`mailto:${site.email}`}>
          {site.email}
        </a>
      </p>
      <p>
        Teléfonos:
        {" "}
        <a className="text-datum-cyan" href="tel:+34613676524">
          {site.phones[0]}
        </a>
        {" · "}
        <a className="text-datum-cyan" href="tel:+34915271501">
          {site.phones[1]}
        </a>
      </p>
      <p>
        Dirección: {site.address.streetAddress}, {site.address.addressLocality},
        {site.address.postalCode}. Horario de atención: lunes a jueves de 08:30
        a 17:00 y viernes de 08:30 a 14:00.
      </p>
      <p>
        En una solicitud fuera del flujo estándar conviene indicar dirección,
        localidad, superficie aproximada, número de plantas, tipo de entregable
        requerido y plazo deseado. Con esa información DATUM puede valorar el
        alcance técnico y responder con una propuesta más ajustada.
      </p>
    </PublicInfoPage>
  );
}
