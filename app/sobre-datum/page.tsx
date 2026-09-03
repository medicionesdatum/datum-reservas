import type { Metadata } from "next";
import { PublicInfoPage } from "@/components/PublicInfoPage";
import { absoluteUrl, site } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Sobre DATUM",
  description: "Quiénes somos y cómo trabaja DATUM Mediciones.",
  alternates: {
    canonical: absoluteUrl("/sobre-datum")
  }
};

export default function AboutPage() {
  return (
    <PublicInfoPage eyebrow="Empresa" title="Sobre DATUM Mediciones">
      <p>
        DATUM Mediciones documenta la realidad exacta de inmuebles mediante
        escaneado láser 3D y procesos de documentación técnica orientados a
        arquitectura, reforma, construcción y análisis inmobiliario. El objetivo
        de la plataforma es que el cliente pueda reservar una medición con una
        base clara de alcance, fecha, precio y datos necesarios para preparar la
        visita.
      </p>
      <p>
        El servicio parte de una captura técnica del espacio y transforma esa
        información en entregables útiles para equipos profesionales: nubes de
        puntos, planos 2D y modelos 3D Revit. Cada opción responde a una
        necesidad distinta. La nube de puntos sirve como base para estudios que
        modelan internamente; los planos 2D ayudan a trabajar con plantas,
        secciones y alzados; y el modelo 3D Revit ofrece una base BIM para
        proyectos que requieren mayor nivel de documentación.
      </p>
      <p>
        La reserva automática está pensada para inmuebles dentro de Madrid
        ciudad. Si el inmueble está fuera de Madrid ciudad o supera los 400 m²,
        DATUM revisa el caso de forma personalizada para valorar desplazamiento,
        alcance, tiempos de entrega y condiciones técnicas antes de confirmar
        una propuesta.
      </p>
      <p>
        Los datos de contacto oficiales son {site.email}, {site.phones[0]} y
        {site.phones[1]}. La atención se realiza de lunes a jueves de 08:30 a
        17:00 y los viernes de 08:30 a 14:00.
      </p>
    </PublicInfoPage>
  );
}
