import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNavigation } from "@/components/SiteNavigation";
import {
  absoluteUrl,
  faqItems,
  serviceDetails,
  site
} from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Información y servicios de medición láser 3D",
  description:
    "Conoce los servicios de DATUM Mediciones, cómo realizamos cada levantamiento, los formatos de entrega, los plazos y las preguntas frecuentes.",
  alternates: {
    canonical: absoluteUrl("/servicios")
  },
  openGraph: {
    title: "Información y servicios | DATUM Mediciones",
    description:
      "Nubes de puntos, planos 2D y modelos 3D Revit obtenidos mediante escaneado láser 3D en Madrid.",
    url: absoluteUrl("/servicios")
  }
};

const processSteps = [
  "Contacto y preparación de la visita técnica.",
  "Escaneado láser 3D in situ con Leica BLK2GO.",
  "Registro y procesado de la nube de puntos.",
  "Delineación 2D o modelado 3D, según el servicio.",
  "Control de calidad de la documentación.",
  "Entrega digital en los formatos contratados."
] as const;

const serviceGuide = [
  {
    need: "Tu equipo modela internamente y solo necesita los datos capturados",
    service: "Nube de Puntos 3D"
  },
  {
    need: "Necesitas planos del estado actual para un proyecto, licencia o reforma",
    service: "Planos 2D Estado Actual"
  },
  {
    need: "Quieres un modelo tridimensional listo para trabajar en Revit",
    service: "Modelo 3D Revit"
  }
] as const;

export default function ServicesPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  };

  return (
    <div className="min-h-screen bg-[#071321] text-slate-100">
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c")
        }}
        type="application/ld+json"
      />

      <header className="border-b border-datum-line bg-datum-ink/90">
        <SiteNavigation compact />
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-datum-line px-5 py-16 md:px-8 md:py-24">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(22,217,230,0.14),transparent_28rem)]" />
          <div className="relative mx-auto max-w-7xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-datum-cyan">
              Escaneado láser 3D · Levantamiento arquitectónico · Documentación técnica
            </p>
            <div className="mt-5 grid items-end gap-10 lg:grid-cols-[1.35fr_0.65fr]">
              <div>
                <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-white md:text-6xl">
                  Documentamos tu proyecto para que proyectes sobre una base fiable.
                </h1>
                <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300 md:text-lg">
                  DATUM convierte espacios reales en datos precisos: nubes de puntos,
                  planos 2D y modelos 3D capturados con Leica BLK2GO y preparados para
                  arquitectura, reformas, construcción y análisis inmobiliario.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    className="rounded bg-datum-cyan px-6 py-3 font-semibold text-datum-ink transition hover:bg-cyan-200"
                    href="/#reserva"
                  >
                    Reservar medición
                  </Link>
                  <a
                    className="rounded border border-datum-line px-6 py-3 font-semibold text-white transition hover:border-datum-cyan"
                    href="#servicios"
                  >
                    Ver servicios
                  </a>
                </div>
              </div>

              <dl className="grid grid-cols-3 overflow-hidden rounded-lg border border-datum-line bg-white/5 lg:grid-cols-1">
                <Metric value="±10 mm" label="Precisión aproximada" />
                <Metric value="<30 min" label="Captura por cada 300 m²" />
                <Metric value="100%" label="Trazabilidad del dato" />
              </dl>
            </div>
          </div>
        </section>

        <section className="px-5 py-16 md:px-8 md:py-24">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <p className="section-eyebrow">Quiénes somos</p>
              <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
                Datos reales para decisiones técnicas.
              </h2>
            </div>
            <div className="space-y-5 text-base leading-8 text-slate-300">
              <p>
                DATUM es la unidad de escaneado láser 3D y documentación técnica de
                DOGROUP STUDIO. Hemos realizado más de 50 mediciones en Madrid con un
                equipo especializado en captura LiDAR y procesado de nubes de puntos.
              </p>
              <p>
                Trabajamos con Leica BLK2GO para la captura, PinPoint para el procesado,
                ZWCAD para la delineación y Revit para el modelado. Cada documento parte
                de un punto capturado en el inmueble, reduciendo la incertidumbre desde
                el inicio del proyecto.
              </p>
              <Link className="inline-flex font-semibold text-datum-cyan hover:text-cyan-200" href="/sobre-datum">
                Conocer más sobre DATUM →
              </Link>
            </div>
          </div>
        </section>

        <section className="border-y border-datum-line bg-datum-panel/35 px-5 py-16 md:px-8 md:py-24" id="servicios">
          <div className="mx-auto max-w-7xl scroll-mt-20">
            <SectionHeading
              eyebrow="Nuestros servicios"
              title="Elige el nivel de documentación que necesita tu proyecto."
              body="Todos los servicios parten de la misma captura láser. Lo que cambia es el nivel de procesado y documentación que recibes."
            />

            <div className="mt-12 space-y-8">
              {serviceDetails.map((service, index) => (
                <article
                  className="grid overflow-hidden rounded-xl border border-datum-line bg-datum-ink/70 lg:grid-cols-[0.9fr_1.1fr]"
                  id={service.id}
                  key={service.id}
                >
                  <div className="p-6 md:p-8 lg:p-10">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-datum-cyan">
                      Servicio {index + 1}
                    </p>
                    <h3 className="mt-3 text-2xl font-semibold text-white md:text-3xl">
                      {service.name}
                    </h3>
                    <p className="mt-5 leading-7 text-slate-300">{service.summary}</p>
                    <dl className="mt-7 space-y-4 border-t border-datum-line pt-6 text-sm">
                      <InfoLine label="Formatos" value={service.formats} />
                      <InfoLine label="Plazo" value={service.delivery} />
                    </dl>
                    <p className="mt-6 text-sm leading-6 text-slate-400">{service.scope}</p>
                  </div>
                  <MediaPlaceholder serviceName={service.name} />
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-16 md:px-8 md:py-24" id="como-trabajamos">
          <div className="mx-auto max-w-7xl scroll-mt-20">
            <SectionHeading
              eyebrow="Cómo trabajamos"
              title="De la captura al documento final."
              body="Un proceso claro, con control técnico en cada fase y entrega completamente digital."
            />
            <ol className="mt-12 grid gap-px overflow-hidden rounded-xl border border-datum-line bg-datum-line md:grid-cols-2 lg:grid-cols-3">
              {processSteps.map((step, index) => (
                <li className="bg-datum-ink p-6 md:p-8" key={step}>
                  <span className="text-3xl font-semibold text-datum-cyan">0{index + 1}</span>
                  <p className="mt-4 leading-7 text-slate-200">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-y border-datum-line bg-white/[0.025] px-5 py-16 md:px-8 md:py-24" id="comparativa">
          <div className="mx-auto max-w-7xl scroll-mt-20">
            <SectionHeading
              eyebrow="Guía rápida"
              title="¿Qué servicio te conviene?"
              body="Elige según el uso que dará tu equipo a la información después de la visita."
            />
            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              {serviceGuide.map((item) => (
                <article className="rounded-xl border border-datum-line bg-datum-panel/65 p-6" key={item.service}>
                  <p className="text-sm leading-6 text-slate-400">Si necesitas...</p>
                  <p className="mt-3 min-h-20 text-lg leading-7 text-white">{item.need}</p>
                  <p className="mt-6 border-t border-datum-line pt-5 text-lg font-semibold text-datum-cyan">
                    {item.service}
                  </p>
                </article>
              ))}
            </div>

            <div className="mt-14 overflow-x-auto rounded-xl border border-datum-line">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <caption className="bg-datum-ink px-6 py-5 text-left text-xl font-semibold text-white">
                  Especificaciones técnicas
                </caption>
                <thead className="bg-datum-panel text-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Servicio</th>
                    <th className="px-6 py-4 font-semibold">Tecnología</th>
                    <th className="px-6 py-4 font-semibold">Formatos principales</th>
                    <th className="px-6 py-4 font-semibold">Plazo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-datum-line bg-white/[0.025] text-slate-300">
                  <SpecRow service="Nube de Puntos 3D" technology="PinPoint" formats="E57 / RCP" delivery="1-2 días hábiles" />
                  <SpecRow service="Planos 2D Estado Actual" technology="ZWCAD" formats="E57 / RCP / DXF-DWG / PDF" delivery="2-3 días hábiles" />
                  <SpecRow service="Modelo 3D Revit" technology="Revit" formats="E57 / RCP / RVT-IFC / DXF-DWG / PDF" delivery="3-5 días hábiles" />
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="px-5 py-16 md:px-8 md:py-24" id="casos-de-uso">
          <div className="mx-auto max-w-7xl scroll-mt-20">
            <SectionHeading
              eyebrow="Casos de uso"
              title="Una base útil para distintos equipos."
              body="Documentamos viviendas, locales, oficinas, naves, plazas, patios y cubiertas."
            />
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              <article className="rounded-xl border border-datum-line bg-white/5 p-7 md:p-9">
                <h3 className="text-2xl font-semibold text-white">Arquitectura e interiorismo</h3>
                <p className="mt-4 leading-7 text-slate-300">
                  Un estado actual fiable para proyectar distribuciones, reformas y
                  espacios sobre datos reales, no sobre suposiciones.
                </p>
              </article>
              <article className="rounded-xl border border-datum-line bg-white/5 p-7 md:p-9">
                <h3 className="text-2xl font-semibold text-white">Constructoras e inmobiliarias</h3>
                <p className="mt-4 leading-7 text-slate-300">
                  Documentación precisa para el control de obra, la ejecución de un
                  proyecto o la comercialización técnica de un inmueble.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="border-y border-datum-line bg-datum-panel/35 px-5 py-16 md:px-8 md:py-24" id="preguntas-frecuentes">
          <div className="mx-auto max-w-4xl scroll-mt-20">
            <SectionHeading
              eyebrow="Preguntas frecuentes"
              title="Resolvemos las dudas más habituales."
              body="Información práctica antes de elegir un servicio o reservar una visita."
            />
            <div className="mt-10 divide-y divide-datum-line rounded-xl border border-datum-line bg-datum-ink/75">
              {faqItems.map((item) => (
                <details className="group px-5 py-1 md:px-7" key={item.question}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 font-semibold text-white transition hover:text-datum-cyan [&::-webkit-details-marker]:hidden">
                    {item.question}
                    <span aria-hidden="true" className="text-xl text-datum-cyan transition group-open:rotate-180">⌄</span>
                  </summary>
                  <p className="max-w-3xl pb-6 leading-7 text-slate-300">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-16 md:px-8 md:py-24" id="contacto">
          <div className="mx-auto grid max-w-7xl scroll-mt-20 gap-8 rounded-xl border border-datum-cyan/40 bg-[linear-gradient(135deg,rgba(22,217,230,0.12),rgba(11,29,50,0.82))] p-7 md:p-12 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="section-eyebrow">Contacto</p>
              <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
                ¿Hablamos de tu próximo levantamiento?
              </h2>
              <p className="mt-5 max-w-3xl leading-7 text-slate-300">
                Cuéntanos qué espacio necesitas documentar y te orientaremos sobre el
                flujo de captura y entrega más adecuado para tu proyecto.
              </p>
              <p className="mt-4 text-sm text-slate-400">
                {site.address.streetAddress}, Arganzuela, Madrid · {site.phones.join(" · ")}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:flex-col">
              <Link className="rounded bg-datum-cyan px-6 py-3 text-center font-semibold text-datum-ink hover:bg-cyan-200" href="/#reserva">
                Reservar medición
              </Link>
              <a className="rounded border border-datum-line px-6 py-3 text-center font-semibold text-white hover:border-datum-cyan" href={`mailto:${site.email}`}>
                Escribir a DATUM
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-r border-datum-line p-4 text-center last:border-r-0 lg:border-b lg:border-r-0 lg:p-6 lg:last:border-b-0">
      <dt className="text-xl font-semibold text-datum-cyan md:text-2xl">{value}</dt>
      <dd className="mt-1 text-xs leading-5 text-slate-400 md:text-sm">{label}</dd>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  body
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="section-eyebrow">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">{title}</h2>
      <p className="mt-5 text-base leading-7 text-slate-300 md:text-lg">{body}</p>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-3">
      <dt className="text-slate-400">{label}</dt>
      <dd className="font-semibold text-white">{value}</dd>
    </div>
  );
}

function MediaPlaceholder({ serviceName }: { serviceName: string }) {
  return (
    <div
      aria-label={`Espacios reservados para el material audiovisual de ${serviceName}`}
      className="grid grid-cols-2 gap-3 border-t border-datum-line bg-white/[0.025] p-4 lg:border-l lg:border-t-0"
    >
      <div className="col-span-2 flex aspect-video items-center justify-center rounded-lg border border-dashed border-datum-line bg-datum-panel/45 p-5 text-center">
        <div>
          <p className="text-sm font-semibold text-slate-200">Vídeo de YouTube</p>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Aquí irá el vídeo de {serviceName}.
          </p>
        </div>
      </div>
      {[1, 2, 3, 4].map((item) => (
        <div
          className="flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed border-datum-line bg-datum-panel/45 p-4 text-center"
          key={item}
        >
          <div>
            <p className="text-sm font-semibold text-slate-300">Imagen {item}</p>
            <p className="mt-1 text-xs text-slate-500">Espacio reservado</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function SpecRow({
  service,
  technology,
  formats,
  delivery
}: {
  service: string;
  technology: string;
  formats: string;
  delivery: string;
}) {
  return (
    <tr>
      <th className="px-6 py-4 font-semibold text-white" scope="row">{service}</th>
      <td className="px-6 py-4">{technology}</td>
      <td className="px-6 py-4">{formats}</td>
      <td className="px-6 py-4">{delivery}</td>
    </tr>
  );
}
