import Image from "next/image";
import Link from "next/link";
import { MoreInfoMenu } from "@/components/MoreInfoMenu";

const navButtonClass =
  "rounded-md border border-datum-cyan/70 bg-datum-cyan/10 px-3 py-2 text-center font-semibold text-datum-cyan transition hover:bg-datum-cyan hover:text-datum-ink sm:px-4";

export function SiteNavigation({ compact = false }: { compact?: boolean }) {
  return (
    <nav
      aria-label="Navegación principal"
      className={`relative z-10 mx-auto flex max-w-7xl flex-col items-stretch justify-between gap-5 px-5 sm:flex-row sm:items-center md:px-8 ${
        compact ? "py-5" : "py-6"
      }`}
    >
      <Link
        aria-label="DATUM Mediciones, inicio"
        className="shrink-0 self-start"
        href="/"
      >
        <Image
          alt="DATUM"
          className={`h-auto ${compact ? "w-36 md:w-40" : "w-36 md:w-52"}`}
          height={300}
          priority
          src="/assets/datum-logo.png"
          width={1200}
        />
      </Link>

      <div className="grid w-full grid-cols-2 gap-2 text-xs text-slate-200 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:justify-end sm:gap-x-4 sm:gap-y-2 sm:text-sm md:gap-x-5">
        <MoreInfoMenu />
        <Link
          className={navButtonClass}
          href="/servicios#preguntas-frecuentes"
        >
          FAQ
        </Link>
        <Link className={navButtonClass} href="/#reserva">
          Reservar
        </Link>
        <Link
          className={navButtonClass}
          href="/servicios#contacto"
        >
          Contacto
        </Link>
        <Link
          className={navButtonClass}
          href="/admin"
        >
          Acceso admin
        </Link>
      </div>
    </nav>
  );
}
