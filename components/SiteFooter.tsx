import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-datum-line bg-[#071321]">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:grid-cols-2 md:px-8 md:py-16 lg:grid-cols-[1.2fr_0.8fr_0.9fr_1fr]">
        <div>
          <Image
            alt="DATUM"
            className="h-auto w-44"
            height={300}
            src="/assets/datum-logo.png"
            width={1200}
          />
          <p className="mt-5 max-w-sm text-sm leading-6 text-slate-400">
            Escaneado láser 3D, planos 2D y modelos 3D precisos para trabajar
            sobre una base técnica fiable.
          </p>
          <div className="mt-6 flex gap-3">
            <SocialLink
              href="https://www.linkedin.com/company/medicionesdatum/"
              label="LinkedIn"
            >
              in
            </SocialLink>
            <SocialLink
              href="https://www.instagram.com/datum.mediciones"
              label="Instagram"
            >
              ig
            </SocialLink>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-white">
            Horario de atención
          </h2>
          <div className="mt-5 space-y-3 text-sm leading-6 text-slate-300">
            <p>
              <strong className="block text-white">Lunes a jueves</strong>
              08:30 - 17:00
            </p>
            <p>
              <strong className="block text-white">Viernes</strong>
              08:30 - 14:00
            </p>
          </div>
        </div>

        <nav aria-label="Información legal y corporativa">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-white">
            Información
          </h2>
          <div className="mt-5 flex flex-col items-start gap-3 text-sm text-slate-300">
            <Link className="transition hover:text-datum-cyan" href="/servicios">
              Servicios y FAQ
            </Link>
            <Link className="transition hover:text-datum-cyan" href="/sobre-datum">
              Sobre DATUM
            </Link>
            <Link className="transition hover:text-datum-cyan" href="/contacto">
              Contacto
            </Link>
            <Link className="transition hover:text-datum-cyan" href="/privacidad">
              Privacidad
            </Link>
            <Link className="transition hover:text-datum-cyan" href="/terminos">
              Términos y condiciones
            </Link>
            <Link
              className="transition hover:text-datum-cyan"
              href="/politica-cancelacion"
            >
              Política de cancelación
            </Link>
          </div>
        </nav>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-white">
            Contacto
          </h2>
          <address className="mt-5 space-y-3 text-sm not-italic leading-6 text-slate-300">
            <a
              aria-label="Llamar a DATUM al +34 613 676 524"
              className="datum-contact-link"
              href="tel:+34613676524"
            >
              +34 613 676 524
            </a>
            <a
              aria-label="Llamar a DATUM al +34 915 271 501"
              className="datum-contact-link"
              href="tel:+34915271501"
            >
              +34 915 271 501
            </a>
            <a
              className="datum-contact-link"
              href="mailto:info@medicionesdatum.es"
            >
              info@medicionesdatum.es
            </a>
            <a
              className="datum-contact-link max-w-xs"
              href="https://www.google.com/maps/search/?api=1&query=Calle+de+Tarragona+20+28045+Madrid"
              rel="noreferrer"
              target="_blank"
            >
              C. de Tarragona 20, Arganzuela, Madrid, 28045
            </a>
          </address>
        </div>
      </div>
      <div className="border-t border-white/10 px-5 py-5 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} DATUM Mediciones. Todos los derechos reservados.
      </div>
    </footer>
  );
}

function SocialLink({
  href,
  label,
  children
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      aria-label={label}
      className="flex size-10 items-center justify-center rounded border border-datum-line text-xs font-bold uppercase text-datum-cyan transition hover:border-datum-cyan hover:bg-datum-cyan hover:text-datum-ink"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {children}
    </a>
  );
}
