import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogContent } from "@/components/BlogContent";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNavigation } from "@/components/SiteNavigation";
import { blogCoverStyle, getPublishedBlogPost } from "@/lib/blog";
import { blogReadingMinutes } from "@/lib/blog-shared";
import { absoluteUrl, site } from "@/lib/site-content";

export const revalidate = 0;

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedBlogPost(slug);
  if (!post) return { title: "Artículo no encontrado" };

  const url = absoluteUrl(`/blog/${post.slug}`);
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url,
      type: "article",
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at,
      authors: [post.author_name],
      images: post.cover_image_url ? [{ url: post.cover_image_url, alt: post.title }] : undefined
    }
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPublishedBlogPost(slug);
  if (!post) notFound();

  const publishedAt = post.published_at ?? post.created_at;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: post.cover_image_url || absoluteUrl("/assets/datum-hero.jpg"),
    datePublished: publishedAt,
    dateModified: post.updated_at,
    author: { "@type": "Organization", name: post.author_name },
    publisher: {
      "@type": "Organization",
      name: site.name,
      logo: { "@type": "ImageObject", url: absoluteUrl("/assets/datum-logo.png") }
    },
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
    inLanguage: "es-ES"
  };
  const cover = blogCoverStyle(post.cover_image_url);

  return (
    <div className="min-h-screen bg-[#06111f] text-white">
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} type="application/ld+json" />
      <SiteNavigation compact />
      <main>
        <article>
          <header className="border-y border-datum-line bg-[#071523]">
            <div className="mx-auto max-w-5xl px-5 py-14 md:px-8 md:py-20">
              <Link className="text-sm font-semibold text-datum-cyan" href="/blog">← Volver al blog</Link>
              <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs uppercase tracking-[0.14em] text-slate-400">
                <span className="font-semibold text-datum-cyan">{post.category}</span>
                <span aria-hidden="true">/</span>
                <time dateTime={publishedAt}>{formatBlogDate(publishedAt)}</time>
                <span aria-hidden="true">/</span>
                <span>{blogReadingMinutes(post.content)} min de lectura</span>
              </div>
              <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-tight md:text-6xl">{post.title}<span className="text-datum-cyan">.</span></h1>
              <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-300">{post.excerpt}</p>
              <p className="mt-6 text-sm text-slate-500">Por {post.author_name}</p>
            </div>
          </header>

          <div className="mx-auto max-w-6xl px-5 pt-10 md:px-8 md:pt-14">
            <div
              aria-label={`Portada de ${post.title}`}
              className={`blog-cover ${cover ? "" : "blog-visual"} aspect-[16/9] border border-datum-line`}
              role="img"
              style={cover}
            >
              {!cover ? <span className="blog-visual-mark">DATUM / {post.category}</span> : null}
            </div>
          </div>

          <div className="mx-auto max-w-3xl px-5 py-12 md:px-8 md:py-16">
            <BlogContent content={post.content} />

            <aside className="mt-16 border-l-4 border-datum-cyan bg-[#0a1929] p-6 md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-datum-cyan">¿Necesitas una base técnica fiable?</p>
              <h2 className="mt-3 text-2xl font-semibold">Hablemos de tu proyecto.</h2>
              <p className="mt-3 leading-7 text-slate-300">Cuéntanos qué inmueble necesitas medir y qué documentación técnica requiere tu equipo.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link className="bg-datum-cyan px-5 py-3 font-semibold text-datum-ink" href="/#reserva">Reservar medición</Link>
                <Link className="border border-datum-cyan px-5 py-3 font-semibold text-datum-cyan" href="/contacto">Contactar</Link>
              </div>
            </aside>
          </div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}

function formatBlogDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}
