import type { Metadata } from "next";
import { PublicInfoPage } from "@/components/PublicInfoPage";
import { absoluteUrl, site } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Privacidad",
  description: "Información básica sobre privacidad y tratamiento de datos en DATUM Mediciones.",
  alternates: {
    canonical: absoluteUrl("/privacidad")
  }
};

export default function PrivacyPage() {
  return (
    <PublicInfoPage eyebrow="Privacidad" title="Política de privacidad">
      <p>
        Esta página resume cómo se tratan los datos facilitados a través de la
        plataforma de reservas de DATUM Mediciones. La información introducida
        por el cliente se utiliza para gestionar la solicitud, calcular el
        presupuesto, coordinar la visita técnica, confirmar el pago del depósito
        y mantener el seguimiento operativo de la medición.
      </p>
      <p>
        Los datos que puede solicitar la plataforma incluyen nombre, correo
        electrónico, teléfono, dirección del inmueble, localidad, código postal,
        superficie aproximada, número de plantas, servicio seleccionado, fecha y
        hora de visita, aceptación de condiciones y notas adicionales aportadas
        por el cliente. También se guardan referencias técnicas de pago para
        conciliar la reserva con la pasarela Square.
      </p>
      <p>
        La base de datos operativa se gestiona mediante Supabase. Cuando Square
        confirma el pago del depósito, los datos necesarios para gestionar el
        proyecto se reflejan también en el CRM interno de DATUM alojado en Notion.
        Los pagos se procesan mediante Square y los correos transaccionales se
        envían mediante Resend. DATUM no debe solicitar al cliente contraseñas
        personales, números completos de tarjeta o claves privadas por correo
        electrónico.
      </p>
      <section
        className="space-y-4 rounded-lg border border-datum-line bg-white/[0.03] p-5"
        id="cookies-estadisticas"
      >
        <h2 className="text-2xl font-semibold text-white">
          Cookies estadísticas y Google Analytics
        </h2>
        <p>
          DATUM utiliza Google Analytics 4 únicamente cuando el visitante acepta
          las cookies estadísticas. La herramienta permite conocer de forma
          agregada qué páginas se visitan y cómo se utiliza la web para mejorar
          su funcionamiento. No se envían a Google los nombres, correos,
          teléfonos, direcciones, referencias de reserva ni las notas
          introducidas por el cliente.
        </p>
        <p>
          La elección se guarda en el navegador y puede modificarse en cualquier
          momento mediante el botón «Cookies» disponible en la web. Las rutas del
          panel administrativo y de confirmación de reservas están excluidas de
          la medición.
        </p>
      </section>
      <p>
        El cliente puede contactar en {site.email} para consultar dudas sobre
        sus datos, corregir información de una reserva o solicitar información
        adicional sobre el tratamiento aplicado. Esta política es una guía
        informativa del funcionamiento actual de la plataforma y puede requerir
        revisión legal si el cliente necesita una política formal completa.
      </p>
    </PublicInfoPage>
  );
}
