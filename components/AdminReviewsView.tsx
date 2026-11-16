"use client";

import { useCallback, useEffect, useState } from "react";
import type { GoogleReview, GoogleReviewsSettings } from "@/lib/google-reviews";

type ReviewForm = {
  authorName: string;
  reviewText: string;
  rating: number;
  reviewLabel: string;
  isVisible: boolean;
};

type SettingsForm = {
  profileUrl: string;
  writeReviewUrl: string;
  ratingAverage: string;
  reviewCount: string;
};

const emptyForm: ReviewForm = { authorName: "", reviewText: "", rating: 5, reviewLabel: "", isVisible: true };

const inputClass = "focus-ring mt-2 w-full rounded border border-datum-line bg-white px-4 py-3";

export function AdminReviewsView({
  email,
  password,
  setMessage
}: {
  email: string;
  password: string;
  setMessage: (message: string) => void;
}) {
  const [reviews, setReviews] = useState<GoogleReview[]>([]);
  const [settings, setSettings] = useState<SettingsForm>({ profileUrl: "", writeReviewUrl: "", ratingAverage: "", reviewCount: "" });
  const [form, setForm] = useState<ReviewForm>(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Con la sesión restaurada por cookie no hay clave en memoria: el servidor acepta la cookie.
  const request = useCallback(
    (init: RequestInit & { url?: string } = {}) =>
      fetch(init.url ?? "/api/admin/reviews", {
        ...init,
        headers: {
          ...(init.body ? { "Content-Type": "application/json" } : {}),
          ...(email && password ? { "x-admin-email": email, "x-admin-password": password } : {})
        }
      }),
    [email, password]
  );

  useEffect(() => {
    let cancelled = false;
    request()
      .then(async (response) => {
        const payload = await response.json();
        if (cancelled) return;
        if (!response.ok) {
          setMessage(payload.error ?? "No se pudieron cargar las reseñas.");
          return;
        }
        setReviews(payload.reviews ?? []);
        const saved = payload.settings as GoogleReviewsSettings | null;
        setSettings({
          profileUrl: saved?.profile_url ?? "",
          writeReviewUrl: saved?.write_review_url ?? "",
          ratingAverage: saved?.rating_average != null ? String(saved.rating_average) : "",
          reviewCount: saved?.review_count != null ? String(saved.review_count) : ""
        });
      })
      .catch(() => !cancelled && setMessage("No se pudieron cargar las reseñas."))
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [request, setMessage]);

  async function reload() {
    const response = await request();
    const payload = await response.json();
    if (response.ok) setReviews(payload.reviews ?? []);
  }

  async function saveReview() {
    setIsSaving(true);
    const response = await request({
      method: editingId ? "PATCH" : "POST",
      body: JSON.stringify({ id: editingId || undefined, ...form })
    });
    const payload = await response.json();
    setIsSaving(false);
    if (!response.ok) {
      setMessage(payload.error ?? "No se pudo guardar la reseña.");
      return;
    }
    setMessage(editingId ? "Reseña actualizada." : "Reseña añadida.");
    setForm(emptyForm);
    setEditingId("");
    await reload();
  }

  async function toggleVisible(review: GoogleReview) {
    const response = await request({
      method: "PATCH",
      body: JSON.stringify({
        id: review.id,
        authorName: review.author_name,
        reviewText: review.review_text,
        rating: review.rating,
        reviewLabel: review.review_label ?? "",
        isVisible: !review.is_visible
      })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(payload.error ?? "No se pudo cambiar la reseña.");
      return;
    }
    await reload();
  }

  async function move(review: GoogleReview, direction: "up" | "down") {
    const response = await request({ method: "PATCH", body: JSON.stringify({ id: review.id, move: direction }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(payload.error ?? "No se pudo reordenar.");
      return;
    }
    await reload();
  }

  async function deleteReview(review: GoogleReview) {
    if (!window.confirm(`¿Eliminar la reseña de “${review.author_name}”?`)) return;
    const response = await request({ method: "DELETE", url: `/api/admin/reviews?id=${review.id}` });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(payload.error ?? "No se pudo eliminar la reseña.");
      return;
    }
    if (editingId === review.id) {
      setForm(emptyForm);
      setEditingId("");
    }
    setMessage("Reseña eliminada.");
    await reload();
  }

  async function saveSettings() {
    const response = await request({
      method: "PUT",
      body: JSON.stringify({
        profileUrl: settings.profileUrl,
        writeReviewUrl: settings.writeReviewUrl,
        ratingAverage: settings.ratingAverage.replace(",", "."),
        reviewCount: settings.reviewCount
      })
    });
    const payload = await response.json();
    setMessage(response.ok ? "Datos de la ficha de Google guardados." : payload.error ?? "No se pudieron guardar los datos.");
  }

  function editReview(review: GoogleReview) {
    setEditingId(review.id);
    setForm({
      authorName: review.author_name,
      reviewText: review.review_text,
      rating: review.rating,
      reviewLabel: review.review_label ?? "",
      isVisible: review.is_visible
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="space-y-10">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-datum-cyan">Opiniones</p>
        <h1 className="mt-2 text-3xl font-semibold">Reseñas de Google</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
          Copia aquí las reseñas de vuestra ficha de Google que quieras enseñar en la web. Se muestran en la portada y en la página de Servicios, siempre marcadas como reseñas de Google.
        </p>
      </header>

      <section className="border border-datum-line bg-white/[0.025] p-5">
        <h2 className="text-lg font-semibold">{editingId ? "Editar reseña" : "Añadir reseña"}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label>
            <span className="text-sm text-slate-300">Nombre de quien la escribió</span>
            <input className={inputClass} maxLength={80} onChange={(event) => setForm({ ...form, authorName: event.target.value })} value={form.authorName} />
          </label>
          <label>
            <span className="text-sm text-slate-300">Puntuación</span>
            <select className={`${inputClass} text-datum-ink`} onChange={(event) => setForm({ ...form, rating: Number(event.target.value) })} value={form.rating}>
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>{"★".repeat(value)} ({value})</option>
              ))}
            </select>
          </label>
          <label className="sm:col-span-2">
            <span className="text-sm text-slate-300">Texto de la reseña</span>
            <textarea className={`${inputClass} min-h-32`} maxLength={1500} onChange={(event) => setForm({ ...form, reviewText: event.target.value })} placeholder="Pega el texto tal cual aparece en Google." value={form.reviewText} />
          </label>
          <label>
            <span className="text-sm text-slate-300">Cuándo la escribió (opcional)</span>
            <input className={inputClass} maxLength={40} onChange={(event) => setForm({ ...form, reviewLabel: event.target.value })} placeholder="Por ejemplo: hace 1 año, o octubre 2026" value={form.reviewLabel} />
          </label>
          <label className="flex items-center gap-3 self-end pb-3">
            <input checked={form.isVisible} className="size-4" onChange={(event) => setForm({ ...form, isVisible: event.target.checked })} type="checkbox" />
            <span className="text-sm text-slate-300">Mostrar en la web</span>
          </label>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button className="rounded bg-datum-cyan px-5 py-3 font-semibold text-datum-ink disabled:opacity-50" disabled={isSaving} onClick={saveReview} type="button">
            {isSaving ? "Guardando..." : editingId ? "Guardar cambios" : "Añadir reseña"}
          </button>
          {editingId ? (
            <button className="rounded border border-datum-line px-5 py-3 text-slate-300 hover:text-white" onClick={() => { setForm(emptyForm); setEditingId(""); }} type="button">
              Cancelar
            </button>
          ) : null}
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-xl font-semibold">Reseñas guardadas</h2>
          <span className="text-sm text-slate-400">{reviews.length}</span>
        </div>
        <div className="mt-5 space-y-3">
          {reviews.map((review, index) => (
            <article className="border border-datum-line bg-white/[0.025] p-4" key={review.id}>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold uppercase tracking-[0.12em]">
                <span className={review.is_visible ? "text-datum-cyan" : "text-amber-200"}>{review.is_visible ? "Visible" : "Oculta"}</span>
                <span className="text-amber-400">{"★".repeat(review.rating)}</span>
                <span className="text-slate-400">{review.author_name}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-300">{review.review_text}</p>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-datum-line pt-3 text-sm">
                <button className="font-semibold text-datum-cyan" onClick={() => editReview(review)} type="button">Editar</button>
                <button className="text-slate-300 hover:text-white" onClick={() => toggleVisible(review)} type="button">{review.is_visible ? "Ocultar" : "Mostrar"}</button>
                <button className="text-slate-300 hover:text-white disabled:opacity-30" disabled={index === 0} onClick={() => move(review, "up")} type="button">Subir</button>
                <button className="text-slate-300 hover:text-white disabled:opacity-30" disabled={index === reviews.length - 1} onClick={() => move(review, "down")} type="button">Bajar</button>
                <button className="text-rose-200 hover:text-white" onClick={() => deleteReview(review)} type="button">Eliminar</button>
              </div>
            </article>
          ))}
          {!reviews.length && !isLoading ? (
            <div className="border border-dashed border-datum-line px-5 py-12 text-center">
              <p className="font-semibold text-white">Todavía no hay reseñas.</p>
              <p className="mt-2 text-sm text-slate-400">Mientras no haya ninguna visible, la sección no aparece en la web.</p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="border-t border-datum-line pt-6">
        <h2 className="text-xl font-semibold">Ficha de Google</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          Estos datos se escriben a mano: actualízalos de vez en cuando con lo que veas en vuestra ficha de Google.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="text-sm text-slate-300">Enlace a la ficha de Google (Ver todas)</span>
            <input className={inputClass} onChange={(event) => setSettings({ ...settings, profileUrl: event.target.value })} placeholder="https://www.google.com/maps/place/..." type="url" value={settings.profileUrl} />
          </label>
          <label className="sm:col-span-2">
            <span className="text-sm text-slate-300">Enlace para escribir una reseña (opcional; si lo dejas vacío se usa el de la ficha)</span>
            <input className={inputClass} onChange={(event) => setSettings({ ...settings, writeReviewUrl: event.target.value })} placeholder="https://g.page/r/.../review" type="url" value={settings.writeReviewUrl} />
          </label>
          <label>
            <span className="text-sm text-slate-300">Nota media (por ejemplo 4,9)</span>
            <input className={inputClass} inputMode="decimal" onChange={(event) => setSettings({ ...settings, ratingAverage: event.target.value })} value={settings.ratingAverage} />
          </label>
          <label>
            <span className="text-sm text-slate-300">Número total de reseñas</span>
            <input className={inputClass} inputMode="numeric" onChange={(event) => setSettings({ ...settings, reviewCount: event.target.value })} value={settings.reviewCount} />
          </label>
        </div>
        <button className="mt-5 rounded border border-datum-cyan px-5 py-3 font-semibold text-datum-cyan transition hover:bg-datum-cyan hover:text-datum-ink" onClick={saveSettings} type="button">
          Guardar datos de la ficha
        </button>
      </section>
    </div>
  );
}
