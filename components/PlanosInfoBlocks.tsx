import { site } from "@/lib/site-content";

const extras = [
  "Alzados interiores",
  "Representación de mobiliario",
  "Instalaciones existentes visibles (cuadros eléctricos, bajantes, registros, rejillas, conductos, puntos de agua…)"
] as const;

const studioMailto = `mailto:${site.email}?subject=${encodeURIComponent("Estudio: plantilla propia")}`;

/** Información sobre planos 2D y estudios, debajo del asistente de reserva de la home. */
export function PlanosInfoBlocks() {
  return (
    <section className="px-4 pb-4 md:px-8 md:pb-8">
      <div className="mx-auto grid max-w-7xl items-start gap-5 lg:grid-cols-2">
        <article className="rounded-xl border border-datum-line bg-white/5 p-7 md:p-9">
          <h2 className="text-2xl font-semibold text-white">Qué incluyen los planos 2D de estado actual</h2>
          <p className="mt-4 leading-7 text-slate-300">
            El levantamiento estándar incluye una planta del estado actual, un alzado de fachada y una sección.
            Como el escaneo láser captura toda la geometría del espacio, en ese entregable ya van acotados los
            huecos de ventanas y puertas, las alturas libres, los pilares vistos, las vigas descolgadas, los
            desniveles, las superficies y las cotas.
          </p>
          <p className="mt-4 leading-7 text-slate-300">Si tu proyecto necesita información adicional, como:</p>
          <ul className="mt-3 space-y-2 leading-7 text-slate-300">
            {extras.map((item) => (
              <li className="flex gap-3" key={item}>
                <span className="mt-3 size-1.5 shrink-0 rounded-full bg-datum-cyan" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 leading-7 text-slate-300">
            escríbenos a{" "}
            <a className="text-datum-cyan underline underline-offset-4 hover:text-cyan-200" href={`mailto:${site.email}`}>
              {site.email}
            </a>{" "}
            antes de reservar y te preparamos una propuesta.
          </p>
        </article>

        <article className="rounded-xl border border-datum-line bg-white/5 p-7 md:p-9">
          <h2 className="text-2xl font-semibold text-white">¿Eres estudio de arquitectura o interiorismo?</h2>
          <p className="mt-4 leading-7 text-slate-300">
            Entregamos los planos con la plantilla, las capas y el estilo propios de DATUM. Si tu estudio trabaja
            con los suyos, dínoslo: nos adaptamos a vuestra forma de trabajar y os pasamos un presupuesto ajustado
            a lo que necesitáis.
          </p>
          <p className="mt-4 leading-7 text-slate-300">
            <a className="text-datum-cyan underline underline-offset-4 hover:text-cyan-200" href={studioMailto}>
              Escríbenos a {site.email}
            </a>
          </p>
        </article>
      </div>
    </section>
  );
}
