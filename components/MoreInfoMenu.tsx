"use client";

import { useRef } from "react";

const menuItems = [
  { label: "Servicios", href: "/servicios#servicios" },
  { label: "Proceso", href: "/servicios#como-trabajamos" },
  { label: "Comparativa", href: "/servicios#comparativa" },
  { label: "Casos de uso", href: "/servicios#casos-de-uso" }
] as const;

export function MoreInfoMenu({ onNavigate }: { onNavigate?: () => void }) {
  const menuRef = useRef<HTMLDetailsElement>(null);

  function closeMenu() {
    menuRef.current?.removeAttribute("open");
    onNavigate?.();
  }

  return (
    <details
      className="group relative w-full lg:w-auto"
      ref={menuRef}
    >
      <summary className="flex cursor-pointer list-none items-center justify-center gap-1.5 rounded-md border border-datum-cyan/70 bg-datum-cyan/10 px-3 py-2 font-semibold text-datum-cyan transition hover:bg-datum-cyan hover:text-datum-ink lg:justify-start lg:px-4 [&::-webkit-details-marker]:hidden">
        Más información
        <span
          aria-hidden="true"
          className="text-sm text-datum-cyan transition group-hover:text-datum-ink group-open:rotate-180"
        >
          ⌄
        </span>
      </summary>
      <div className="relative mt-2 w-full space-y-2 overflow-hidden rounded-lg border border-datum-line bg-[#06111f] p-2 shadow-2xl lg:absolute lg:left-0 lg:top-full lg:z-50 lg:mt-3 lg:w-52">
        {menuItems.map((item) => (
          <a
            className="block rounded border border-datum-cyan/30 bg-[#0b1d32] px-4 py-3 text-sm font-semibold text-datum-cyan transition hover:bg-datum-cyan hover:text-datum-ink"
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
