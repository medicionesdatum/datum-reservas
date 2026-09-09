import { SiteFooter } from "@/components/SiteFooter";
import { SiteNavigation } from "@/components/SiteNavigation";

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
    <div className="min-h-screen bg-[#071321] text-slate-100">
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
