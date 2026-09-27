"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { MoreInfoMenu } from "@/components/MoreInfoMenu";

const navButtonClass =
  "rounded-md border border-datum-cyan/70 bg-datum-cyan/10 px-3 py-2 text-center font-semibold text-datum-cyan transition hover:bg-datum-cyan hover:text-datum-ink lg:px-4";

export function SiteNavigation({ compact = false }: { compact?: boolean }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  return (
    <nav
      aria-label="Navegación principal"
      className={`relative z-30 mx-auto flex max-w-7xl flex-col items-stretch justify-between gap-4 px-5 md:px-8 lg:flex-row lg:items-center lg:gap-5 ${
        compact ? "py-5" : "py-6"
      }`}
    >
      <div className="flex w-full items-center justify-between gap-4 lg:contents">
        <Link
          aria-label="DATUM Mediciones, inicio"
          className="shrink-0"
          href="/"
          onClick={closeMobileMenu}
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

        <button
          aria-controls="site-navigation-links"
          aria-expanded={isMobileMenuOpen}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-datum-cyan/70 bg-datum-cyan/10 px-4 py-2 text-sm font-semibold text-datum-cyan transition hover:bg-datum-cyan hover:text-datum-ink lg:hidden"
          onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
          type="button"
        >
          {isMobileMenuOpen ? "Cerrar" : "Menú"}
          <span aria-hidden="true" className="text-lg leading-none">
            {isMobileMenuOpen ? "×" : "☰"}
          </span>
        </button>
      </div>

      <div
        className={`${
          isMobileMenuOpen ? "grid" : "hidden"
        } w-full grid-cols-1 gap-2 rounded-lg border border-datum-line bg-[#06111f] p-3 text-sm text-slate-200 lg:flex lg:w-auto lg:flex-wrap lg:items-center lg:justify-end lg:gap-x-4 lg:gap-y-2 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 xl:gap-x-5`}
        id="site-navigation-links"
      >
        <MoreInfoMenu onNavigate={closeMobileMenu} />
        <Link
          className={navButtonClass}
          href="/servicios#preguntas-frecuentes"
          onClick={closeMobileMenu}
        >
          FAQ
        </Link>
        <Link
          className={navButtonClass}
          href="/#reserva"
          onClick={closeMobileMenu}
        >
          Reservar
        </Link>
        <Link
          className={navButtonClass}
          href="/servicios#contacto"
          onClick={closeMobileMenu}
        >
          Contacto
        </Link>
        <Link
          className={navButtonClass}
          href="/admin"
          onClick={closeMobileMenu}
        >
          Acceso admin
        </Link>
      </div>
    </nav>
  );
}
