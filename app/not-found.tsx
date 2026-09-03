import Link from "next/link";
import { publicPages } from "@/lib/site-content";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#071321] px-5 py-16 text-slate-100">
      <section className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-datum-cyan">
          404
        </p>
        <h1 className="mt-4 text-4xl font-semibold text-white">
          Página no encontrada
        </h1>
        <p className="mt-5 text-base leading-7 text-slate-300">
          La URL solicitada no existe o ha cambiado. Puedes volver a la reserva
          principal, consultar la información de contacto o revisar las páginas
          públicas disponibles.
        </p>
        <nav className="mt-8 grid gap-3 sm:grid-cols-2">
          {publicPages.map((page) => (
            <Link
              className="rounded border border-datum-line bg-white/5 px-4 py-3 text-sm text-slate-100 transition hover:border-datum-cyan"
              href={page.path}
              key={page.path}
            >
              {page.title}
            </Link>
          ))}
        </nav>
      </section>
    </main>
  );
}
