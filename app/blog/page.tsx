import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNavigation } from "@/components/SiteNavigation";
import { blogCoverStyle, getPublishedBlogPosts } from "@/lib/blog";
import { blogReadingMinutes } from "@/lib/blog-shared";
import { absoluteUrl } from "@/lib/site-content";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Blog de medición láser 3D y documentación técnica",
  description:
    "Ideas, guías y casos sobre escaneado láser 3D, nubes de puntos, planos 2D, modelos Revit y documentación técnica de inmuebles.",
  alternates: {
    canonical: absoluteUrl("/blog")
  },
  openGraph: {
    title: "Blog | DATUM Mediciones",
    description:
      "Conocimiento técnico para medir, documentar y transformar inmuebles con mayor precisión.",
    url: absoluteUrl("/blog"),
    type: "website"
  }
};

export default async function BlogPage() {
  const posts = await getPublishedBlogPosts();
  const [featured, ...rest] = posts;
  const featuredCover = blogCoverStyle(featured?.cover_image_url);

  return (
    <div className="min-h-screen bg-[#06111f] text-white">
      <SiteNavigation compact />
      <main>
        <header className="border-y border-datum-line bg-[#071523]">
          <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-datum-cyan">
              CONOCIMIENTO DATUM
            </p>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight md:text-6xl">
              Medir mejor para proyectar con certeza<span className="text-datum-cyan">.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
              Guías, procesos e innovación aplicada al escaneado láser 3D, la documentación técnica y la transformación de espacios existentes.
            </p>
          </div>
        </header>

        <section className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-20">
          {featured ? (
            <>
              <article className="grid overflow-hidden border border-datum-line bg-[#091827] lg:grid-cols-[1.5fr_1fr]">
                <Link
                  aria-label={`Leer ${featured.title}`}
                  className={`blog-cover ${featuredCover ? "" : "blog-visual"} aspect-[16/9] border-b border-datum-line lg:border-b-0 lg:border-r`}
                  href={`/blog/${featured.slug}`}
                  style={featuredCover}
                >
                  {!featuredCover ? <span className="blog-visual-mark">DATUM / INSIGHT</span> : null}
                </Link>
                {/* En escritorio la altura la fija solo la portada 16:9; el texto se ajusta a ella. */}
                <div className="lg:relative">
                  <div className="flex flex-col justify-center p-7 md:p-10 lg:absolute lg:inset-0 lg:overflow-hidden lg:p-8">
                    <BlogMeta post={featured} />
                    <h2 className="mt-5 text-3xl font-semibold leading-tight md:text-4xl lg:mt-4 lg:text-2xl xl:text-3xl">{featured.title}</h2>
                    <p className="mt-5 text-base leading-7 text-slate-300 lg:mt-4 lg:line-clamp-3">{featured.excerpt}</p>
                    <Link className="mt-8 inline-flex items-center gap-3 font-semibold text-datum-cyan lg:mt-5" href={`/blog/${featured.slug}`}>
                      Leer artículo <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </div>
              </article>

              {rest.length ? (
                <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {rest.map((post) => <BlogCard key={post.id} post={post} />)}
                </div>
              ) : null}
            </>
          ) : (
            <div className="grid min-h-[360px] place-items-center border border-dashed border-datum-line bg-[#081522] px-6 text-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-datum-cyan">Próximamente</p>
                <h2 className="mt-4 text-3xl font-semibold">Estamos preparando el primer artículo.</h2>
                <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-400">
                  Compartiremos contenido útil sobre medición láser 3D, nubes de puntos, planos 2D y modelos Revit.
                </p>
                <Link className="mt-7 inline-flex border border-datum-cyan px-5 py-3 font-semibold text-datum-cyan transition hover:bg-datum-cyan hover:text-datum-ink" href="/servicios">
                  Explorar nuestros servicios
                </Link>
              </div>
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function BlogCard({ post }: { post: Awaited<ReturnType<typeof getPublishedBlogPosts>>[number] }) {
  const cover = blogCoverStyle(post.cover_image_url);
  return (
    <article className="flex h-full flex-col border border-datum-line bg-[#091827]">
      <Link
        aria-label={`Leer ${post.title}`}
        className={`blog-cover ${cover ? "" : "blog-visual"} aspect-[16/9] border-b border-datum-line`}
        href={`/blog/${post.slug}`}
        style={cover}
      >
        {!cover ? <span className="blog-visual-mark">DATUM / INSIGHT</span> : null}
      </Link>
      <div className="flex flex-1 flex-col p-6">
        <BlogMeta post={post} />
        <h2 className="mt-4 text-xl font-semibold leading-7">{post.title}</h2>
        <p className="mt-3 flex-1 text-sm leading-6 text-slate-400">{post.excerpt}</p>
        <Link className="mt-6 font-semibold text-datum-cyan" href={`/blog/${post.slug}`}>Leer artículo →</Link>
      </div>
    </article>
  );
}

function BlogMeta({ post }: { post: Awaited<ReturnType<typeof getPublishedBlogPosts>>[number] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs uppercase tracking-[0.12em] text-slate-400">
      <span className="font-semibold text-datum-cyan">{post.category}</span>
      <span aria-hidden="true">/</span>
      <time dateTime={post.published_at ?? post.created_at}>{formatBlogDate(post.published_at ?? post.created_at)}</time>
      <span aria-hidden="true">/</span>
      <span>{blogReadingMinutes(post.content)} min</span>
    </div>
  );
}

function formatBlogDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}
