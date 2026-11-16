import { getPublicGoogleReviews } from "@/lib/google-reviews-data";
import { shortenReview } from "@/lib/google-reviews";

function GoogleMark({ className = "size-5" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span aria-label={`${rating} de 5 estrellas`} className="inline-flex gap-0.5 text-amber-400" role="img">
      {Array.from({ length: 5 }, (_, index) => (
        <svg aria-hidden="true" className={`size-4 ${index < Math.round(rating) ? "" : "opacity-25"}`} fill="currentColor" key={index} viewBox="0 0 20 20">
          <path d="M10 1.5l2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L1.4 7.8l6-.8L10 1.5z" />
        </svg>
      ))}
    </span>
  );
}

/** Reseñas de Google elegidas por DATUM. Se oculta sola si todavía no hay ninguna visible. */
export async function GoogleReviews() {
  const { reviews, settings } = await getPublicGoogleReviews();
  if (!reviews.length) return null;

  const profileUrl = settings?.profile_url ?? null;
  const writeUrl = settings?.write_review_url ?? profileUrl;
  const average = settings?.rating_average ? Number(settings.rating_average) : null;
  const count = settings?.review_count ?? null;

  return (
    <section aria-labelledby="resenas-google" className="px-5 py-16 md:px-8 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="section-eyebrow">Opiniones</p>
            <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl" id="resenas-google">
              Lo que dicen nuestros clientes
            </h2>
            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-300">
              <span className="inline-flex items-center gap-2">
                <GoogleMark />
                <strong className="font-semibold text-white">Reseñas de Google</strong>
              </span>
              {average ? (
                <span className="inline-flex items-center gap-2">
                  <strong className="text-lg text-white">{average.toLocaleString("es-ES", { minimumFractionDigits: 1 })}</strong>
                  <Stars rating={average} />
                  {count ? <span className="text-slate-400">· {count.toLocaleString("es-ES")} reseñas</span> : null}
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {profileUrl ? (
              <a className="rounded border border-datum-line px-5 py-3 text-sm font-semibold text-white transition hover:border-datum-cyan" href={profileUrl} rel="noopener noreferrer" target="_blank">
                Ver todas en Google
              </a>
            ) : null}
            {writeUrl ? (
              <a className="rounded bg-datum-cyan px-5 py-3 text-sm font-semibold text-datum-ink transition hover:bg-cyan-200" href={writeUrl} rel="noopener noreferrer" target="_blank">
                Escribe una reseña
              </a>
            ) : null}
          </div>
        </div>

        <ul className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-color:#16d9e6_transparent]">
          {reviews.map((review) => {
            const excerpt = shortenReview(review.review_text);
            return (
              <li className="w-[280px] shrink-0 snap-start sm:w-[330px]" key={review.id}>
                <article className="flex h-full flex-col rounded-lg border border-datum-line bg-[#091827] p-6">
                  <div className="flex items-center gap-3">
                    <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-datum-cyan/15 font-semibold text-datum-cyan">
                      {review.author_name.trim().charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-white">{review.author_name}</p>
                      <p className="text-xs text-slate-400">{review.review_label ? `${review.review_label} · ` : ""}Reseña de Google</p>
                    </div>
                    <GoogleMark className="size-5 shrink-0" />
                  </div>
                  <div className="mt-4">
                    <Stars rating={review.rating} />
                  </div>
                  <p className="mt-3 flex-1 text-sm leading-6 text-slate-300">{excerpt.text}</p>
                  {excerpt.truncated && profileUrl ? (
                    <a className="mt-4 text-sm font-semibold text-datum-cyan" href={profileUrl} rel="noopener noreferrer" target="_blank">
                      Leer más en Google
                    </a>
                  ) : null}
                </article>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
