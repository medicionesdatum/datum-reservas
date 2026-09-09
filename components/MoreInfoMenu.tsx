"use client";

import { useRef } from "react";

const menuItems = [
  { label: "Servicios", href: "/servicios#servicios" },
  { label: "Proceso", href: "/servicios#como-trabajamos" },
  { label: "Comparativa", href: "/servicios#comparativa" },
  { label: "Casos de uso", href: "/servicios#casos-de-uso" }
] as const;

export function MoreInfoMenu() {
  const menuRef = useRef<HTMLDetailsElement>(null);

  function closeMenu() {
    menuRef.current?.removeAttribute("open");
  }

  return (
    <details
      className="group relative col-span-2 sm:col-span-1"
      ref={menuRef}
    >
      <summary className="flex cursor-pointer list-none items-center justify-center gap-1.5 rounded-md border border-datum-cyan/70 bg-datum-cyan/10 px-3 py-2 font-semibold text-datum-cyan transition hover:bg-datum-cyan hover:text-datum-ink sm:justify-start sm:px-4 [&::-webkit-details-marker]:hidden">
        Más información
        <span
          aria-hidden="true"
          className="text-sm text-datum-cyan transition group-hover:text-datum-ink group-open:rotate-180"
        >
          ⌄
        </span>
      </summary>
      <div className="absolute right-0 top-full z-50 mt-3 w-52 space-y-2 overflow-hidden rounded-lg border border-datum-line bg-datum-ink/95 p-2 shadow-2xl backdrop-blur">
        {menuItems.map((item) => (
          <a
            className="block rounded border border-datum-cyan/30 bg-datum-cyan/5 px-4 py-3 text-sm font-semibold text-datum-cyan transition hover:bg-datum-cyan hover:text-datum-ink"
            href={item.href}
            key={item.href}
            onClick={closeMenu}
          >
            {item.label}
          </a>
        ))}
      </div>
    </details>
  );
}
