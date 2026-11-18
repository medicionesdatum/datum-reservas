import Link from "next/link";
import { getPublishedBlogPosts } from "@/lib/blog";

/** Últimos artículos publicados, para enlazar el blog desde la home y /servicios. Se oculta si no hay artículos. */
export async function BlogLinks() {
  const posts = await getPublishedBlogPosts(3);
  if (!posts.length) return null;

  return (
    <section aria-labelledby="guias-blog" className="px-4 py-8 md:px-8 md:py-12">
      <div className="mx-auto max-w-7xl">
        <p className="section-eyebrow">Blog</p>
        <h2 className="mt-3 text-2xl font-semibold text-white md:text-3xl" id="guias-blog">
          Guías para entender y elegir tu medición
        </h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {posts.map((post) => (
            <Link
              className="flex flex-col rounded-xl border border-datum-line bg-white/5 p-6 transition hover:border-datum-cyan"
              href={`/blog/${post.slug}`}
              key={post.id}
            >
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-datum-cyan">{post.category}</span>
              <span className="mt-3 text-lg font-semibold leading-7 text-white">{post.title}</span>
              <span className="mt-3 line-clamp-3 flex-1 text-sm leading-6 text-slate-400">{post.excerpt}</span>
              <span className="mt-5 text-sm font-semibold text-datum-cyan">Leer artículo →</span>
            </Link>
          ))}
        </div>
        <p className="mt-6">
          <Link className="text-sm font-semibold text-datum-cyan hover:text-cyan-200" href="/blog">
            Ver todos los artículos →
          </Link>
        </p>
      </div>
    </section>
  );
}
