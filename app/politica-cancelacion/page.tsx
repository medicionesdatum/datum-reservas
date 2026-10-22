import type { Metadata } from "next";
import Link from "next/link";
import { PublicInfoPage } from "@/components/PublicInfoPage";
import { absoluteUrl, site } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Política de cancelación",
  description: "Reglas de cambios de fecha y cancelaciones de reservas DATUM.",
  alternates: {
    canonical: absoluteUrl("/politica-cancelacion")
  }
};

export default function CancellationPolicyPage() {
  return (
    <PublicInfoPage eyebrow="Reservas" title="Política de cambio de fecha y cancelación">
      <p>
        Las reservas de DATUM Mediciones se organizan con antelación para
        coordinar agenda, desplazamiento, equipo técnico y condiciones de acceso
        al inmueble. Por ese motivo, el cliente puede solicitar un cambio de día
        o una cancelación hasta 48 horas antes de la cita seleccionada en la
        plataforma.
      </p>
      <p>
        Una vez superado ese plazo de 48 horas, cualquier modificación deberá
        coordinarse directamente con DATUM. En ese caso, el equipo revisará la
        disponibilidad, el estado de la agenda y las condiciones concretas de la
        medición para valorar si es posible reprogramar la visita o proponer una
        alternativa.
      </p>
      <p>
        La reserva automática exige seleccionar horarios disponibles con al menos
        24 horas de anticipación. No se permiten reservas automáticas para el
        mismo día. Esta regla ayuda a asegurar que el equipo pueda preparar el
        servicio, revisar los datos del inmueble y contactar con el cliente si
        falta información relevante.
      </p>
      <p>
        Para evitar incidencias el día de la medición, el cliente debe garantizar
        que todas las zonas estén accesibles, que existan llaves o permisos de
        entrada necesarios y que el espacio permita la circulación del técnico.
        Si alguna condición cambia antes de la visita, debe comunicarse cuanto
        antes a {site.email}.
      </p>
      <div className="border-l-4 border-datum-cyan bg-white/[0.04] px-6 py-6 md:px-8">
        <p className="m-0 text-xs font-semibold uppercase tracking-[0.2em] text-datum-cyan">
          Gestión de la reserva
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-white">
          ¿Necesitas cambiar la fecha de tu cita?
        </h2>
        <p className="mt-3 text-slate-300">
          Indica el nombre de la reserva, la fecha actual y las alternativas que
          te encajan. El equipo de DATUM revisará la disponibilidad contigo.
        </p>
        <Link
          className="focus-ring mt-6 inline-flex min-h-12 items-center justify-center bg-datum-cyan px-6 py-3 text-sm font-semibold text-datum-ink transition hover:bg-white"
          href="/contacto"
        >
          Contactar con DATUM <span aria-hidden="true" className="ml-3">→</span>
        </Link>
      </div>
    </PublicInfoPage>
  );
}
