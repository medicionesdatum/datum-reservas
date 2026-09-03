import type { Metadata } from "next";
import Link from "next/link";
import { PublicInfoPage } from "@/components/PublicInfoPage";
import { absoluteUrl, site } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description: "Condiciones básicas de uso de la plataforma de reservas de DATUM Mediciones.",
  alternates: {
    canonical: absoluteUrl("/terminos")
  }
};

export default function TermsPage() {
  return (
    <PublicInfoPage eyebrow="Condiciones" title="Términos y condiciones">
      <p>
        La plataforma de reservas de DATUM Mediciones permite solicitar servicios
        de medición láser 3D, seleccionar características del inmueble, elegir
        una fecha disponible y pagar un depósito para iniciar la coordinación de
        la visita. La reserva automática está orientada a inmuebles ubicados en
        Madrid ciudad y dentro de los rangos de superficie disponibles en el
        formulario.
      </p>
      <p>
        El precio mostrado se calcula en función del servicio seleccionado, la
        superficie indicada y las características adicionales que correspondan.
        Los importes incluyen el cálculo de IVA aplicable y muestran el depósito
        necesario para reservar. El saldo pendiente podrá gestionarse después
        según el flujo operativo de DATUM.
      </p>
      <p>
        La cita queda operativamente confirmada cuando Square confirma el pago
        del depósito y la plataforma recibe la confirmación técnica del pago. Si
        el usuario abandona el proceso de pago antes de completarlo, la reserva
        puede quedar como pendiente y no debe considerarse confirmada.
      </p>
      <p>
        El cliente debe garantizar el acceso al inmueble y a las zonas que deban
        medirse, así como condiciones mínimas de circulación e iluminación. Si
        existen limitaciones de acceso, zonas comunes, trasteros, cuartos de
        instalaciones o áreas sin luz, conviene comunicarlo antes de la visita.
      </p>
      <p>
        Las reglas de cambio de fecha y cancelación se explican en la
        {" "}
        <Link className="text-datum-cyan" href="/politica-cancelacion">
          política de cancelación
        </Link>
        . Para cualquier duda, DATUM atiende en {site.email}.
      </p>
    </PublicInfoPage>
  );
}
