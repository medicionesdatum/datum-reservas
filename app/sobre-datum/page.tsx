import type { Metadata } from "next";
import { PublicInfoPage } from "@/components/PublicInfoPage";
import { absoluteUrl, site } from "@/lib/site-content";
import { aboutPageJsonLd } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Sobre DATUM",
  description: "Qué es DATUM y cómo trabaja DATUM Mediciones.",
  alternates: {
    canonical: absoluteUrl("/sobre-datum")
  }
};

export default function AboutPage() {
  return (
    <PublicInfoPage
      eyebrow="Empresa"
      extraJsonLd={aboutPageJsonLd({
        path: "/sobre-datum",
        name: "Sobre DATUM",
        description: metadata.description as string
      })}
      path="/sobre-datum"
      title="Sobre DATUM"
    >
      <p className="text-xl font-medium leading-8 text-slate-100 md:text-2xl md:leading-9">
        Medimos el edificio como está, no como dicen los planos antiguos.
      </p>
      <p>
        DATUM documenta inmuebles existentes mediante escaneado láser 3D.
        Partimos de una idea sencilla: un proyecto de reforma es tan fiable como
        la medición sobre la que se dibuja. Por eso todo lo que entregamos (nube
        de puntos, planos 2D o modelo 3D Revit) sale de una misma captura láser
        del inmueble, no de croquis ni de medidas sueltas.
      </p>

      <h2 className="pt-4 text-2xl font-semibold text-white md:text-3xl">
        Cómo trabajamos
      </h2>
      <ol className="list-decimal space-y-4 pl-6 marker:font-semibold marker:text-datum-cyan">
        <li>
          <strong className="font-semibold text-white">Preparamos la visita.</strong>{" "}
          Acordamos antes el alcance, los accesos y el entregable, para capturar
          en una sola visita todo lo que el proyecto necesita.
        </li>
        <li>
          <strong className="font-semibold text-white">Escaneamos in situ con Leica BLK2GO.</strong>{" "}
          Recorremos el espacio con el escáner en mano y capturamos su geometría
          completa.
        </li>
        <li>
          <strong className="font-semibold text-white">Procesamos la nube de puntos con PinPoint.</strong>{" "}
          Unimos y depuramos la captura hasta obtener una única nube trazable,
          con una precisión aproximada de ±10 mm.
        </li>
        <li>
          <strong className="font-semibold text-white">Delineamos o modelamos sobre la nube.</strong>{" "}
          Los planos 2D se dibujan en ZWCAD y el modelo 3D en Revit, siempre
          sobre los datos capturados y no a ojo.
        </li>
        <li>
          <strong className="font-semibold text-white">Revisamos antes de entregar.</strong>{" "}
          Comprobamos la documentación antes de enviártela, para que planos y
          modelo coincidan con el edificio.
        </li>
        <li>
          <strong className="font-semibold text-white">Entregamos en digital,</strong>{" "}
          en los formatos que tu equipo ya usa: E57, RCP, DXF/DWG, PDF, RVT e
          IFC, según el servicio.
        </li>
      </ol>
      <p>
        Medir bien una vez reduce los problemas de siempre en obra: un
        replanteo que no cuadra, un hueco que no cabe, planos que no coinciden
        con el edificio.
      </p>

      <h2 className="pt-4 text-2xl font-semibold text-white md:text-3xl">
        Qué debes saber antes de contratar
      </h2>
      <p>
        El modelo 3D Revit incluye los elementos constructivos visibles para el
        escáner; no incluye instalaciones empotradas ni elementos ocultos. La
        reserva online está pensada para inmuebles dentro de Madrid ciudad. Si
        el inmueble está fuera o supera los 400 m², revisamos el caso de forma
        personalizada.
      </p>
      <p>
        Los datos de contacto oficiales son {site.email}, {site.phones[0]} y
        {site.phones[1]}. La atención se realiza de lunes a jueves de 08:30 a
        17:00 y los viernes de 08:30 a 14:00.
      </p>
    </PublicInfoPage>
  );
}
