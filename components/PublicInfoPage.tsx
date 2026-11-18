import { JsonLd } from "@/components/JsonLd";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNavigation } from "@/components/SiteNavigation";
import { publicPages } from "@/lib/site-content";
import { breadcrumbJsonLd } from "@/lib/structured-data";

export function PublicInfoPage({
  eyebrow,
  title,
  path,
  extraJsonLd,
  children
}: {
  eyebrow: string;
  title: string;
  /** Ruta pública de la página; se usa para las migas de pan en los datos estructurados. */
  path: string;
  /** Datos estructurados adicionales propios de la página (por ejemplo AboutPage). */
  extraJsonLd?: unknown;
  children: React.ReactNode;
}) {
  const breadcrumbName = publicPages.find((page) => page.path === path)?.title ?? title;

  return (
    <div className="min-h-screen bg-[#071321] text-slate-100">
      <JsonLd data={breadcrumbJsonLd([{ name: breadcrumbName, path }])} />
      {extraJsonLd ? <JsonLd data={extraJsonLd} /> : null}
      <header className="border-b border-datum-line bg-datum-ink/70">
        <SiteNavigation compact />
      </header>

      <main className="mx-auto max-w-4xl px-5 py-12 md:py-16">
        <article>
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
      </main>

      <SiteFooter />
    </div>
  );
}
