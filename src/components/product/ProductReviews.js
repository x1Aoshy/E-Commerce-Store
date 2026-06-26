"use client";

import { useState } from "react";
import ReviewForm from "@/components/ReviewForm";

function initials(name) {
  return (name || "Cliente")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function Stars({ rating = 5, className = "h-4 w-4" }) {
  return (
    <span className="inline-flex gap-0.5 text-accent-400" aria-label={`${rating} de 5`}>
      {Array.from({ length: 5 }).map((_, s) => (
        <svg
          key={s}
          viewBox="0 0 24 24"
          className={`${className} ${s < Math.round(rating) ? "" : "text-white/15"}`}
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="m12 2 3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01z" />
        </svg>
      ))}
    </span>
  );
}

// Reseñas del producto, dentro de su ficha. Muestra el promedio, la lista de
// reseñas aprobadas y un formulario para dejar la propia (queda pendiente de
// aprobación). `reviews` y los agregados vienen del servidor.
export default function ProductReviews({ productId, reviews = [], ratingAvg = 0, reviewCount = 0 }) {
  const [showForm, setShowForm] = useState(false);

  return (
    <section id="resenas" className="mt-12 scroll-mt-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-ink">Reseñas</h2>
          {reviewCount > 0 ? (
            <div className="mt-1.5 flex items-center gap-2">
              <Stars rating={ratingAvg} />
              <span className="text-sm text-ink-soft">
                {ratingAvg.toFixed(1)} · {reviewCount}{" "}
                {reviewCount === 1 ? "reseña" : "reseñas"}
              </span>
            </div>
          ) : (
            <p className="mt-1 text-sm text-ink-muted">
              Todavía no hay reseñas de este producto. ¡Sé el primero!
            </p>
          )}
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="btn-ghost shrink-0 px-4 py-2.5 text-sm"
        >
          {showForm ? "Cerrar" : "✍️ Escribir reseña"}
        </button>
      </div>

      {showForm && (
        <div className="mt-5 max-w-2xl">
          <ReviewForm productId={productId} onClose={() => setShowForm(false)} />
        </div>
      )}

      {reviews.length > 0 && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {reviews.map((r) => (
            <figure key={r.id} className="card p-5 shadow-soft">
              <div className="flex items-center justify-between gap-2">
                <Stars rating={r.rating} className="h-3.5 w-3.5" />
                {r.createdAt && (
                  <span className="text-xs text-ink-muted">
                    {new Date(r.createdAt).toLocaleDateString("es-NI")}
                  </span>
                )}
              </div>
              <blockquote className="mt-3 text-sm leading-relaxed text-ink-soft">
                “{r.text}”
              </blockquote>
              <figcaption className="mt-4 flex items-center gap-2.5 border-t border-white/10 pt-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-500/15 text-[11px] font-semibold text-accent-300 ring-1 ring-accent-500/25">
                  {initials(r.name)}
                </span>
                <span className="text-sm font-medium text-ink">
                  {r.name || "Cliente"}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </section>
  );
}
