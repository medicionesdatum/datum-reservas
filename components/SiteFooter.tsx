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
              <LinkedInIcon />
            </SocialLink>
            <SocialLink
              href="https://www.instagram.com/datum.mediciones"
              label="Instagram"
            >
              <InstagramIcon />
            </SocialLink>
            <SocialLink
              href="https://www.tiktok.com/@datum.mediciones"
              label="TikTok"
            >
              <TikTokIcon />
            </SocialLink>
            <SocialLink
              href="https://www.youtube.com/@datum.mediciones"
              label="YouTube"
            >
              <YouTubeIcon />
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
            <Link className="transition hover:text-datum-cyan" href="/blog">
              Blog
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
      className="flex size-10 items-center justify-center rounded border border-datum-line text-datum-cyan transition hover:border-datum-cyan hover:bg-datum-cyan hover:text-datum-ink"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {children}
    </a>
  );
}

const iconProps = {
  "aria-hidden": true,
  className: "size-5",
  viewBox: "0 0 24 24"
} as const;

function LinkedInIcon() {
  return (
    <svg {...iconProps} fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg
      {...iconProps}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <rect height="18" rx="5" width="18" x="3" y="3" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" fill="currentColor" r="0.6" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg {...iconProps} fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg {...iconProps} fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}
