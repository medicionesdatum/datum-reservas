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
        La base de datos operativa se gestiona mediante Supabase. Los pagos se
        procesan mediante Square y los correos transaccionales se envían mediante
        Resend. DATUM no debe solicitar al cliente contraseñas personales,
        números completos de tarjeta o claves privadas por correo electrónico.
      </p>
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
