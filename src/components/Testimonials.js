"use client";

import { useState } from "react";
import Reveal from "./Reveal";
import ReviewForm from "./ReviewForm";

function initials(name) {
  return (name || "Cliente")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function Stars({ rating = 5 }) {
  return (
    <div className="flex gap-0.5 text-accent-400" aria-label={`${rating} de 5`}>
      {Array.from({ length: 5 }).map((_, s) => (
        <svg
          key={s}
          viewBox="0 0 24 24"
          className={`h-4 w-4 ${s < rating ? "" : "text-white/15"}`}
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="m12 2 3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01z" />
        </svg>
      ))}
    </div>
  );
}

// Prueba social REAL: muestra las reseñas aprobadas (cargadas desde la base) y
// deja al cliente escribir la suya. Si todavía no hay reseñas, invita a ser el
// primero (sin inventar testimonios).
export default function Testimonials({ reviews = [] }) {
  const [showForm, setShowForm] = useState(false);
  const hasReviews = reviews.length > 0;

  return (
    <section className="border-t border-white/10 bg-white/[0.015]">
      <div className="container-content py-16 sm:py-20">
        <Reveal className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold text-ink sm:text-3xl">
              Lo que dicen nuestros clientes
            </h2>
            <p className="mt-3 text-ink-soft">
              {hasReviews
                ? "Experiencias reales de quienes ya compraron."
                : "Todavía no hay reseñas publicadas. ¡Sé el primero en opinar!"}
            </p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="btn-ghost shrink-0 px-4 py-2.5 text-sm"
          >
            {showForm ? "Cerrar" : "✍️ Escribir reseña"}
          </button>
        </Reveal>

        {showForm && (
          <div className="mt-6 max-w-2xl">
            <ReviewForm onClose={() => setShowForm(false)} />
          </div>
        )}

        {hasReviews && (
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {reviews.slice(0, 6).map((t, i) => (
              <Reveal key={t.id || i} delay={i * 80}>
                <figure className="card h-full p-6 shadow-soft">
                  <Stars rating={t.rating} />
                  <blockquote className="mt-4 text-sm leading-relaxed text-ink-soft">
                    “{t.text}”
                  </blockquote>
                  <figcaption className="mt-5 flex items-center gap-3 border-t border-white/10 pt-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-500/15 text-xs font-semibold text-accent-300 ring-1 ring-accent-500/25">
                      {initials(t.name)}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-ink">
                        {t.name || "Cliente"}
                      </span>
                      <span className="block text-xs text-ink-muted">
                        Cliente verificado
                      </span>
                    </span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
