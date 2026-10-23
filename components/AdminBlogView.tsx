"use client";

import Link from "next/link";
import { useState, type Dispatch, type SetStateAction } from "react";
import {
  blogReadingMinutes,
  normalizeBlogSlug,
  type BlogPost
} from "@/lib/blog-shared";

type BlogForm = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  category: string;
  authorName: string;
  isPublished: boolean;
};

const emptyForm: BlogForm = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverImageUrl: "",
  category: "Innovación",
  authorName: "Equipo DATUM",
  isPublished: false
};

export function AdminBlogView({
  posts,
  email,
  password,
  onPostsChange,
  setMessage
}: {
  posts: BlogPost[];
  email: string;
  password: string;
  onPostsChange: Dispatch<SetStateAction<BlogPost[]>>;
  setMessage: (message: string) => void;
}) {
  const [form, setForm] = useState<BlogForm>(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  function updateForm<K extends keyof BlogForm>(key: K, value: BlogForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateTitle(title: string) {
    setForm((current) => ({
      ...current,
      title,
      slug: slugEdited ? current.slug : normalizeBlogSlug(title)
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId("");
    setSlugEdited(false);
  }

  function editPost(post: BlogPost) {
    setEditingId(post.id);
    setSlugEdited(true);
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      coverImageUrl: post.cover_image_url ?? "",
      category: post.category,
      authorName: post.author_name,
      isPublished: post.is_published
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function savePost() {
    setIsSaving(true);
    const response = await fetch("/api/admin/blog", {
      method: editingId ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-email": email,
        "x-admin-password": password
      },
      body: JSON.stringify({ id: editingId || undefined, ...form })
    });
    const payload = await response.json();
    setIsSaving(false);

    if (!response.ok) {
      setMessage(payload.error ?? "No se pudo guardar el artículo.");
      return;
    }

    const saved = payload.blogPost as BlogPost;
    onPostsChange((current) =>
      editingId
        ? current.map((post) => (post.id === saved.id ? saved : post))
        : [saved, ...current]
    );
    setMessage(saved.is_published ? "Artículo publicado correctamente." : "Borrador guardado.");
    resetForm();
  }

  async function deletePost(post: BlogPost) {
    if (!window.confirm(`¿Eliminar definitivamente “${post.title}”?`)) return;

    const response = await fetch(`/api/admin/blog?id=${post.id}`, {
      method: "DELETE",
      headers: { "x-admin-email": email, "x-admin-password": password }
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(payload.error ?? "No se pudo eliminar el artículo.");
      return;
    }

    onPostsChange((current) => current.filter((item) => item.id !== post.id));
    if (editingId === post.id) resetForm();
    setMessage("Artículo eliminado.");
  }

  async function uploadCover(file?: File) {
    if (!file) return;
    setIsUploading(true);
    const data = new FormData();
    data.append("file", file);
    const response = await fetch("/api/admin/blog-image", {
      method: "POST",
      headers: { "x-admin-email": email, "x-admin-password": password },
      body: data
    });
    const payload = await response.json();
    setIsUploading(false);

    if (!response.ok) {
      setMessage(payload.error ?? "No se pudo subir la imagen.");
      return;
    }

    updateForm("coverImageUrl", payload.url);
    setMessage("Imagen de portada subida.");
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
      <section className="border-t border-datum-line pt-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-datum-cyan">
              {editingId ? "Editar artículo" : "Nuevo artículo"}
            </p>
            <h2 className="mt-2 text-xl font-semibold">
              {editingId ? "Actualiza el contenido" : "Redacta una nueva entrada"}
            </h2>
          </div>
          {editingId ? (
            <button className="text-sm text-slate-400 hover:text-white" onClick={resetForm} type="button">
              Crear uno nuevo
            </button>
          ) : null}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="text-sm text-slate-300">Título</span>
            <input
              className="focus-ring mt-2 w-full rounded border border-datum-line bg-white px-4 py-3"
              maxLength={160}
              onChange={(event) => updateTitle(event.target.value)}
              placeholder="Ej.: Por qué medir antes de reformar"
              value={form.title}
            />
          </label>

          <label className="sm:col-span-2">
            <span className="text-sm text-slate-300">Dirección del artículo</span>
            <div className="mt-2 flex overflow-hidden rounded border border-datum-line bg-white">
              <span className="flex items-center bg-slate-100 px-3 text-sm text-slate-500">/blog/</span>
              <input
                className="focus-ring min-w-0 flex-1 border-0 bg-white px-3 py-3"
                maxLength={120}
                onChange={(event) => {
                  setSlugEdited(true);
                  updateForm("slug", normalizeBlogSlug(event.target.value));
                }}
                value={form.slug}
              />
            </div>
          </label>

          <label>
            <span className="text-sm text-slate-300">Categoría</span>
            <input
              className="focus-ring mt-2 w-full rounded border border-datum-line bg-white px-4 py-3"
              maxLength={80}
              onChange={(event) => updateForm("category", event.target.value)}
              value={form.category}
            />
          </label>

          <label>
            <span className="text-sm text-slate-300">Autor</span>
            <input
              className="focus-ring mt-2 w-full rounded border border-datum-line bg-white px-4 py-3"
              maxLength={120}
              onChange={(event) => updateForm("authorName", event.target.value)}
              value={form.authorName}
            />
          </label>

          <label className="sm:col-span-2">
            <span className="text-sm text-slate-300">Resumen</span>
            <textarea
              className="focus-ring mt-2 min-h-28 w-full rounded border border-datum-line bg-white px-4 py-3"
              maxLength={500}
              onChange={(event) => updateForm("excerpt", event.target.value)}
              placeholder="Este texto aparecerá en el listado del blog y en Google."
              value={form.excerpt}
            />
          </label>

          <div className="sm:col-span-2">
            <span className="text-sm text-slate-300">Imagen de portada</span>
            <div className="mt-2 grid gap-3 md:grid-cols-[1fr_auto]">
              <input
                className="focus-ring w-full rounded border border-datum-line bg-white px-4 py-3"
                onChange={(event) => updateForm("coverImageUrl", event.target.value)}
                placeholder="URL de la imagen o súbela desde tu equipo"
                type="url"
                value={form.coverImageUrl}
              />
              <label className="flex cursor-pointer items-center justify-center rounded border border-datum-cyan px-4 py-3 text-sm font-semibold text-datum-cyan transition hover:bg-datum-cyan hover:text-datum-ink">
                {isUploading ? "Subiendo..." : "Subir imagen"}
                <input
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  disabled={isUploading}
                  onChange={(event) => uploadCover(event.target.files?.[0])}
                  type="file"
                />
              </label>
            </div>
            <p className="mt-2 text-xs text-slate-500">JPG, PNG o WebP. Máximo 5 MB.</p>
            {form.coverImageUrl ? (
              <div
                aria-label="Vista previa de la portada"
                className="mt-4 aspect-[16/7] border border-datum-line bg-[#091827] bg-cover bg-center"
                role="img"
                style={{ backgroundImage: `url(${JSON.stringify(form.coverImageUrl)})` }}
              />
            ) : null}
          </div>

          <label className="sm:col-span-2">
            <span className="text-sm text-slate-300">Contenido</span>
            <textarea
              className="focus-ring mt-2 min-h-[420px] w-full rounded border border-datum-line bg-white px-4 py-3 font-mono text-sm leading-7"
              maxLength={60000}
              onChange={(event) => updateForm("content", event.target.value)}
              placeholder={"Escribe el artículo aquí.\n\nUsa ## para un título de sección, - para listas y **texto** para resaltar."}
              value={form.content}
            />
            <p className="mt-2 text-xs text-slate-500">
              Lectura estimada: {blogReadingMinutes(form.content)} min.
            </p>
          </label>

          <label className="flex items-start gap-3 border border-datum-line bg-white/[0.03] p-4 sm:col-span-2">
            <input
              checked={form.isPublished}
              className="mt-1 size-4"
              onChange={(event) => updateForm("isPublished", event.target.checked)}
              type="checkbox"
            />
            <span className="text-sm text-slate-300">
              <strong className="block text-white">Publicar en la web</strong>
              Si no lo marcas, el artículo quedará guardado como borrador.
            </span>
          </label>
        </div>

        <button
          className="mt-5 w-full rounded bg-datum-cyan px-5 py-3 font-semibold text-datum-ink disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isSaving || isUploading}
          onClick={savePost}
          type="button"
        >
          {isSaving ? "Guardando..." : form.isPublished ? "Guardar y publicar" : "Guardar borrador"}
        </button>
      </section>

      <section className="border-t border-datum-line pt-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-datum-cyan">Biblioteca</p>
            <h2 className="mt-2 text-xl font-semibold">Artículos</h2>
          </div>
          <span className="text-sm text-slate-400">{posts.length}</span>
        </div>

        <div className="mt-5 space-y-3">
          {posts.map((post) => (
            <article className="border border-datum-line bg-white/[0.025] p-4" key={post.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className={`text-xs font-semibold uppercase tracking-[0.12em] ${post.is_published ? "text-datum-cyan" : "text-amber-200"}`}>
                    {post.is_published ? "Publicado" : "Borrador"}
                  </span>
                  <h3 className="mt-2 font-semibold leading-6">{post.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{post.excerpt}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-datum-line pt-3 text-sm">
                <button className="font-semibold text-datum-cyan" onClick={() => editPost(post)} type="button">Editar</button>
                {post.is_published ? <Link className="text-slate-300 hover:text-white" href={`/blog/${post.slug}`} target="_blank">Ver artículo</Link> : null}
                <button className="text-rose-200 hover:text-white" onClick={() => deletePost(post)} type="button">Eliminar</button>
              </div>
            </article>
          ))}
          {!posts.length ? (
            <div className="border border-dashed border-datum-line px-5 py-12 text-center">
              <p className="font-semibold text-white">Todavía no hay artículos.</p>
              <p className="mt-2 text-sm text-slate-400">Crea el primero desde el formulario.</p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
