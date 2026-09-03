import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/site-content";

export function PublicInfoPage({
  eyebrow,
  title,
  children
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#071321] text-slate-100">
      <header className="border-b border-datum-line bg-datum-ink/70">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-5 py-6">
          <Link aria-label="DATUM Mediciones, inicio" href="/">
            <Image
              alt="DATUM"
              className="h-auto w-40"
              height={300}
              priority
              src="/assets/datum-logo.png"
              width={1200}
            />
          </Link>
          <div className="flex gap-4 text-sm text-slate-300">
            <Link className="transition hover:text-datum-cyan" href="/contacto">
              Contacto
            </Link>
            <Link className="transition hover:text-datum-cyan" href="/">
              Reservar
            </Link>
          </div>
        </nav>
      </header>

      <article className="mx-auto max-w-4xl px-5 py-12 md:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-datum-cyan">
          {eyebrow}
        </p>
        <h1 className="mt-4 text-4xl font-semibold text-white md:text-5xl">
          {title}
        </h1>
        <div className="prose-like mt-8 space-y-6 text-base leading-8 text-slate-300">
          {children}
        </div>
      </article>

      <footer className="border-t border-datum-line px-5 py-8 text-center text-sm text-slate-400">
        <p>{site.name} · {site.email}</p>
      </footer>
    </main>
  );
}
