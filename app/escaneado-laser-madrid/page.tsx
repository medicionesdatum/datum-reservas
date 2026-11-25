import type { Metadata } from "next";
import Link from "next/link";
import { DataTable, FaqList, H2, ReserveButton, UpdatedLine } from "@/components/LandingParts";
import { JsonLd } from "@/components/JsonLd";
import { PublicInfoPage } from "@/components/PublicInfoPage";
import { absoluteUrl, site } from "@/lib/site-content";
import { landingPageJsonLd } from "@/lib/structured-data";

const title = "Escaneado láser 3D en Madrid | DATUM Mediciones";
const description =
  "Escaneado láser 3D y levantamientos de planos en Madrid con Leica BLK2GO: nube de puntos, planos 2D del estado actual y modelo 3D en Revit. Reserva online.";
const h1 = "Escaneado láser 3D y levantamientos de planos en Madrid";
const dateModified = "2026-11-25";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: absoluteUrl("/escaneado-laser-madrid") },
  openGraph: { title, description, url: absoluteUrl("/escaneado-laser-madrid") }
};

const link = "text-datum-cyan underline underline-offset-4 hover:text-cyan-200";

const faq = [
  {
    question: "¿Cuánto tarda el escaneado?",
    answer:
      "La visita se completa en poco tiempo: unos 300 m² en menos de 30 minutos. Después, la nube de puntos se entrega en 1-2 días hábiles, los planos 2D en 2-3 y el modelo 3D en 3-5."
  },
  { question: "¿Qué precisión tiene?", answer: "±10 mm." },
  {
    question: "¿Tengo que estar presente durante el escaneado?",
    answer:
      "No es imprescindible, pero necesitamos que una persona facilite el acceso al inmueble y resuelva dudas puntuales durante la visita."
  },
  {
    question: "¿En qué formatos entregáis la documentación?",
    answer:
      "La nube de puntos en E57 y RCP; los planos en DXF/DWG editable y PDF; y los modelos 3D en RVT/IFC, además de DXF/DWG y PDF."
  },
  {
    question: "¿Cuánto cuesta?",
    answer:
      "El precio depende de la superficie y se calcula al reservar. Los precios \"desde\" (sin IVA, para Madrid ciudad) están en Servicios."
  },
  {
    question: "¿Trabajáis fuera de Madrid?",
    answer: "Sí, con presupuesto personalizado por email: info@medicionesdatum.es."
  }
];

const faqItems = faq.map((item) =>
  item.question === "¿Cuánto cuesta?"
    ? {
        question: item.question,
        answer: (
          <>
            El precio depende de la superficie y se calcula al reservar. Los precios &quot;desde&quot; (sin IVA,
            para Madrid ciudad) están en{" "}
            <Link className={link} href="/servicios">
              Servicios
            </Link>
            .
          </>
        )
      }
    : item
);

export default function LaserScanningMadridPage() {
  return (
    <PublicInfoPage eyebrow="Servicios" path="/escaneado-laser-madrid" title={h1}>
      <JsonLd
        data={landingPageJsonLd({
          path: "/escaneado-laser-madrid",
          name: h1,
          description,
          dateModified,
          service: {
            name: "Escaneado láser 3D y levantamientos de planos en Madrid",
            description:
              "Escaneado láser 3D de inmuebles en Madrid con Leica BLK2GO: nube de puntos, planos 2D del estado actual o modelo 3D en Revit."
          },
          faq
        })}
      />
      <UpdatedLine dateTime={dateModified} label="noviembre 2026" />
      <p>
        DATUM Mediciones escanea inmuebles en Madrid con láser 3D y entrega la documentación que necesitas para
        proyectar: nube de puntos, planos 2D del estado actual o un modelo 3D en Revit. Se reserva online, la visita
        de escaneado es rápida y la precisión es de ±10 mm.
      </p>
      <p>
        Llevamos más de 100 mediciones realizadas. Trabajamos con estudios de arquitectura, constructoras,
        inmobiliarias y quienes preparan una reforma o una licencia.
      </p>

      <H2>Qué recibes</H2>
      <p>Escaneamos el inmueble completo con Leica BLK2GO y, según el servicio que elijas, entregas:</p>
      <DataTable
        caption="Servicios, contenido, formatos y plazos"
        head={["Servicio", "Qué incluye", "Formatos", "Plazo desde la visita"]}
        rows={[
          ["Nube de Puntos 3D", "La nube de puntos del inmueble", "E57 y RCP", "1-2 días hábiles"],
          [
            "Planos 2D del estado actual",
            "Nube de puntos, planta, sección y alzado acotados",
            "DXF/DWG y PDF",
            "2-3 días hábiles"
          ],
          [
            "Modelo 3D en Revit",
            "Nube de puntos y modelo con los elementos visibles al escáner",
            "RVT/IFC, DXF/DWG y PDF",
            "3-5 días hábiles"
          ]
        ]}
      />
      <p>
        También ofrecemos planos 2D solo de planta (planta acotada con superficies por estancia, sin sección ni
        alzado). Todos los detalles y los precios &quot;desde&quot; están en{" "}
        <Link className={link} href="/servicios">
          Servicios
        </Link>
        .
      </p>
      <p>
        La nube de puntos en E57 y RCP se abre en Revit y AutoCAD. Si tu estudio ya modela por su cuenta, la nube de
        puntos es suficiente. Si necesitas planos para una licencia o para proyectar una reforma, elige los planos
        2D. Si vas a trabajar sobre un modelo, elige el modelo 3D. En la guía{" "}
        <Link className={link} href="/blog/nube-planos-o-modelo-3d-como-elegir">
          Nube de puntos, planos 2D o modelo 3D: cómo elegir
        </Link>{" "}
        lo explicamos con ejemplos.
      </p>

      <H2>Por qué escanear en vez de medir a mano</H2>
      <p>
        Medir con cinta o distanciómetro lleva horas y deja cotas que luego no cuadran. Con el escáner capturamos el
        espacio completo en una sola pasada: unos 300 m² en menos de 30 minutos, con una precisión de ±10 mm. Esa
        nube de puntos es una copia digital medible del espacio: cualquier cota que necesites después se saca del
        archivo, sin volver al inmueble.
      </p>

      <H2>Para quién es</H2>
      <ul className="list-disc space-y-2 pl-6 marker:text-datum-cyan">
        <li>
          <strong className="font-semibold text-white">Estudios de arquitectura y de interiorismo</strong> que
          necesitan una base fiable antes de proyectar.
        </li>
        <li>
          <strong className="font-semibold text-white">Reformas y licencias:</strong> planos del estado actual de
          viviendas y locales.
        </li>
        <li>
          <strong className="font-semibold text-white">Constructoras e inmobiliarias</strong> que necesitan
          documentar inmuebles de forma rápida.
        </li>
        <li>
          <strong className="font-semibold text-white">Particulares</strong> que preparan una reforma de su vivienda
          y necesitan unos planos fiables del estado actual.
        </li>
      </ul>

      <H2>Cuándo no te hace falta (y cuándo preguntarnos antes)</H2>
      <ul className="list-disc space-y-2 pl-6 marker:text-datum-cyan">
        <li>Si solo necesitas una cota o dos puntuales, una medición manual puede bastar.</li>
        <li>El modelo 3D incluye solo los elementos visibles al escáner: no modelamos instalaciones ocultas.</li>
        <li>
          La reserva online cubre inmuebles en Madrid ciudad de hasta 1.000 m². Fuera de Madrid ciudad o por encima
          de 1.000 m², hacemos un presupuesto personalizado: escríbenos a {site.email}.
        </li>
      </ul>

      <H2>Cómo reservar</H2>
      <ol className="list-decimal space-y-2 pl-6 marker:font-semibold marker:text-datum-cyan">
        <li>Elige el servicio y las características del inmueble.</li>
        <li>Indica el tipo de representación que necesitas.</li>
        <li>Rellena tus datos y elige fecha.</li>
        <li>Paga el depósito online y recibe la confirmación.</li>
      </ol>
      <p>
        Tras la visita, procesamos la captura y te entregamos la documentación en el plazo del servicio. Más detalle
        en{" "}
        <Link className={link} href="/como-trabajamos">
          Cómo trabajamos
        </Link>
        .
      </p>
      <p>
        <ReserveButton />
      </p>

      <H2>Preguntas frecuentes</H2>
      <FaqList items={faqItems} />

      <H2>Contacto</H2>
      <p>
        DATUM Mediciones · {site.address.streetAddress}, {site.address.postalCode} Madrid · {site.email} ·{" "}
        {site.phones[0]} (también WhatsApp) · {site.phones[1]}
        <br />
        Lunes a jueves de 08:30 a 17:00; viernes de 08:30 a 14:30.
      </p>
    </PublicInfoPage>
  );
}
