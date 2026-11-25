import type { Metadata } from "next";
import Link from "next/link";
import { DataTable, FaqList, H2, ReserveButton, UpdatedLine } from "@/components/LandingParts";
import { JsonLd } from "@/components/JsonLd";
import { PublicInfoPage } from "@/components/PublicInfoPage";
import { absoluteUrl, site } from "@/lib/site-content";
import { landingPageJsonLd } from "@/lib/structured-data";

const title = "Cómo trabajamos: del escaneado láser al plano | DATUM";
const description =
  "Así trabajamos en DATUM Mediciones: reserva online, escaneado con Leica BLK2GO, procesado y entrega de nube de puntos, planos 2D o modelo 3D en Revit.";
const h1 = "Cómo trabajamos: del escaneado láser al plano";
const dateModified = "2026-11-25";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: absoluteUrl("/como-trabajamos") },
  openGraph: { title, description, url: absoluteUrl("/como-trabajamos") }
};

const link = "text-datum-cyan underline underline-offset-4 hover:text-cyan-200";
const strong = "font-semibold text-white";

const steps = [
  {
    name: "Reservas online",
    text: "Eliges el servicio, las características del inmueble, el tipo de representación, tus datos y la fecha. Pagas un depósito y recibes la confirmación."
  },
  {
    name: "Escaneado en el inmueble",
    text: "Vamos al inmueble y lo escaneamos con Leica BLK2GO, un escáner láser que capturamos caminando por el espacio."
  },
  {
    name: "Procesado de la nube de puntos",
    text: "Procesamos la captura con PinPoint y obtenemos la nube de puntos del inmueble, en formatos E57 y RCP."
  },
  {
    name: "Planos 2D o modelo 3D (según el servicio)",
    text: "Dibujamos los planos 2D con ZWCAD o modelamos en Revit los elementos visibles al escáner, según el servicio contratado."
  },
  {
    name: "Entrega digital",
    text: "Te entregamos los archivos en formato digital, listos para abrir en Revit, AutoCAD o el programa que uses."
  }
];

const faq = [
  {
    question: "¿Cuánto tarda desde que reservo?",
    answer:
      "Depende de la fecha de la visita y del servicio: la entrega es de 1-2, 2-3 o 3-5 días hábiles desde la visita."
  },
  { question: "¿Con qué escáner trabajáis?", answer: "Con Leica BLK2GO." },
  {
    question: "¿Cómo se procesan los datos?",
    answer: "Con PinPoint, para la nube de puntos; ZWCAD para los planos 2D; Revit para el modelo 3D."
  },
  {
    question: "¿Puedo cambiar o cancelar una reserva?",
    answer:
      "Sí: puedes cambiar el día o cancelar hasta 48 horas antes de la cita. Pasado ese plazo, escríbenos a info@medicionesdatum.es y valoraremos reprogramar o proponerte una alternativa. Consulta la Política de cancelación."
  }
];

const faqItems = faq.map((item) =>
  item.question === "¿Puedo cambiar o cancelar una reserva?"
    ? {
        question: item.question,
        answer: (
          <>
            Sí: puedes cambiar el día o cancelar hasta 48 horas antes de la cita. Pasado ese plazo, escríbenos a{" "}
            {site.email} y valoraremos reprogramar o proponerte una alternativa. Consulta la{" "}
            <Link className={link} href="/politica-cancelacion">
              Política de cancelación
            </Link>
            .
          </>
        )
      }
    : item
);

export default function HowWeWorkPage() {
  return (
    <PublicInfoPage eyebrow="Proceso" path="/como-trabajamos" title={h1}>
      <JsonLd
        data={landingPageJsonLd({
          path: "/como-trabajamos",
          name: h1,
          description,
          dateModified,
          service: {
            name: "Escaneado láser 3D y levantamientos de planos en Madrid",
            description:
              "Proceso de trabajo de DATUM Mediciones: reserva online, escaneado con Leica BLK2GO, procesado y entrega de nube de puntos, planos 2D o modelo 3D en Revit."
          },
          faq,
          howTo: { name: "Cómo trabaja DATUM Mediciones: de la reserva a la entrega", steps }
        })}
      />
      <UpdatedLine dateTime={dateModified} label="noviembre 2026" />
      <p>
        En DATUM Mediciones, un encargo va de la reserva online a la entrega digital en cinco pasos: reservas,
        escaneamos el inmueble con Leica BLK2GO, procesamos la captura, delineamos o modelamos según el servicio y te
        entregamos los archivos. Los plazos se cuentan desde la visita y van de 1 a 5 días hábiles según el servicio.
      </p>

      <H2 id="paso-1">Paso 1: Reservas online</H2>
      <p>
        Eliges el servicio, las características del inmueble, el tipo de representación, tus datos y la fecha. Pagas
        un depósito y recibes la confirmación. La reserva online cubre inmuebles en Madrid ciudad de hasta 1.000 m².
        Para otros casos, presupuesto personalizado por email.
      </p>
      <p>
        La reserva automática requiere al menos 24 horas de anticipación; no hay reservas automáticas para el mismo
        día. Puedes cambiar el día o cancelar hasta 48 horas antes de la cita; pasado ese plazo, escríbenos a{" "}
        {site.email} y valoraremos reprogramar o proponerte una alternativa. Más detalle en{" "}
        <Link className={link} href="/politica-cancelacion">
          Política de cancelación
        </Link>
        .
      </p>

      <H2 id="paso-2">Paso 2: Escaneado en el inmueble</H2>
      <p>
        Vamos al inmueble y lo escaneamos con Leica BLK2GO, un escáner láser que capturamos caminando por el espacio.
        Capturamos unos 300 m² en menos de 30 minutos, interfiriendo lo mínimo posible en la actividad del espacio.
        Necesitamos que una persona facilite el acceso y resuelva dudas puntuales; no es imprescindible que estés
        presente durante todo el escaneado.
      </p>
      <p>
        Más sobre las dos formas de escanear en{" "}
        <Link className={link} href="/blog/escanear-caminando-o-con-tripode">
          Escanear caminando o con trípode
        </Link>
        .
      </p>
      <p>
        <strong className={strong}>Datos técnicos del Leica BLK2GO</strong> (ficha técnica oficial de Leica,
        comprobada el 25/11/2026):
      </p>
      <ul className="list-disc space-y-2 pl-6 marker:text-datum-cyan">
        <li>Alcance: de 0,5 a 25 m.</li>
        <li>Velocidad de captura: 420.000 puntos por segundo.</li>
        <li>
          Precisión: ±10 mm en interior, en condiciones controladas (dato de Leica; coincide con la precisión que
          ofrecemos).
        </li>
        <li>
          Imágenes: tres cámaras panorámicas (sensor de 4,8 Mpx, campo de 300° × 135°) y una cámara de alta
          resolución de 12 Mpx, que dan color a la nube de puntos y permiten navegar por el espacio como en una
          panorámica.
        </li>
      </ul>
      <p className="text-sm text-slate-400">
        Fuente:{" "}
        <a
          className={link}
          href="https://entertainment.leica-geosystems.com/wp-content/uploads/2024/08/BLK2GO_SpecSheet.pdf"
          rel="noopener noreferrer"
          target="_blank"
        >
          ficha técnica del BLK2GO de Leica
        </a>
        .
      </p>

      <H2 id="paso-3">Paso 3: Procesado de la nube de puntos</H2>
      <p>
        Procesamos la captura con PinPoint, de Scasa y Leica. El resultado es la nube de puntos del inmueble, una
        copia digital medible del espacio con una precisión de ±10 mm, que entregamos en formatos E57 y RCP,
        compatibles con Revit y AutoCAD. Si contratas solo la nube de puntos, aquí termina el trabajo: 1-2 días
        hábiles desde la visita.
      </p>

      <H2 id="paso-4">Paso 4: Planos 2D o modelo 3D (según el servicio)</H2>
      <ul className="list-disc space-y-2 pl-6 marker:text-datum-cyan">
        <li>
          <strong className={strong}>Planos 2D del estado actual:</strong> dibujamos la planta, la sección y el
          alzado acotados con ZWCAD y los entregamos en DXF/DWG y PDF. 2-3 días hábiles desde la visita.
        </li>
        <li>
          <strong className={strong}>Modelo 3D en Revit:</strong> modelamos los elementos visibles al escáner en
          Revit y entregamos RVT/IFC, además de DXF/DWG y PDF. 3-5 días hábiles desde la visita. No modelamos
          instalaciones ocultas.
        </li>
        <li>
          <strong className={strong}>Planos 2D solo planta:</strong> planta acotada con superficies por estancia,
          sin sección ni alzado.
        </li>
      </ul>

      <H2 id="paso-5">Paso 5: Entrega digital</H2>
      <p>
        Te entregamos los archivos en formato digital, listos para abrir en Revit, AutoCAD o el programa que uses. Si
        algo no está claro, escríbenos a {site.email}.
      </p>

      <H2>Plazos y entregables de un vistazo</H2>
      <DataTable
        caption="Entregables y plazos por servicio"
        head={["Servicio", "Entregables", "Plazo desde la visita"]}
        rows={[
          ["Nube de Puntos 3D", "E57, RCP", "1-2 días hábiles"],
          ["Planos 2D del estado actual", "Nube, DXF/DWG, PDF", "2-3 días hábiles"],
          ["Modelo 3D en Revit", "Nube, RVT/IFC, DXF/DWG, PDF", "3-5 días hábiles"]
        ]}
      />

      <H2>Qué necesitamos de ti</H2>
      <ul className="list-disc space-y-2 pl-6 marker:text-datum-cyan">
        <li>La dirección y la superficie aproximada del inmueble.</li>
        <li>Una persona que permita el acceso el día de la visita.</li>
        <li>Indicarnos el servicio y el tipo de representación que necesitas.</li>
      </ul>

      <H2>Preguntas frecuentes</H2>
      <FaqList items={faqItems} />

      <p>
        <ReserveButton />
      </p>
      <p>
        Más información sobre qué recibes y para quién es en{" "}
        <Link className={link} href="/escaneado-laser-madrid">
          Escaneado láser 3D en Madrid
        </Link>{" "}
        y en{" "}
        <Link className={link} href="/servicios">
          Servicios
        </Link>
        .
      </p>
    </PublicInfoPage>
  );
}
