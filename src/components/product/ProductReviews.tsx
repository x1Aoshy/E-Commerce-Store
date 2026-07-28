"use client";

import { useMemo, useState } from "react";
import ReviewForm from "@/components/ReviewForm";
import Reveal from "@/components/Reveal";
import { useLang } from "@/context/LanguageContext";

/* ==========================================================================
   RESEÑAS DEL PRODUCTO
   --------------------------------------------------------------------------
   Además de la lista, ahora hay un DESGLOSE por estrellas (cuántas de 5, de 4…).
   Es el gráfico que la gente busca antes de comprar: no basta con "4.8", se
   quiere saber si hay una reseña de 1 estrella escondida. Mostrarlo entero
   genera más confianza que ocultarlo, y sale de contar las reseñas reales.
   ========================================================================== */

function initials(name: string) {
  return (name || "Cliente")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function Stars({ rating = 5, className = "h-4 w-4" }: any) {
  return (
    <span className="inline-flex gap-0.5 text-brand" aria-label={`${rating} de 5`}>
      {Array.from({ length: 5 }).map((_, s) => (
        <svg
          key={s}
          viewBox="0 0 24 24"
          className={`${className} ${s < Math.round(rating) ? "" : "text-line/18"}`}
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="m12 2 3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01z" />
        </svg>
      ))}
    </span>
  );
}

export default function ProductReviews({
  productId,
  reviews = [],
  ratingAvg = 0,
  reviewCount = 0,
}: any) {
  const { t } = useLang();
  const [showForm, setShowForm] = useState(false);

  // Cuántas reseñas hay por puntuación (5 → 1).
  const breakdown = useMemo(() => {
    const buckets = [5, 4, 3, 2, 1].map((star) => ({
      star,
      n: reviews.filter((r: any) => Math.round(r.rating) === star).length,
    }));
    return buckets;
  }, [reviews]);

  return (
    <section id="resenas" className="mt-20 scroll-mt-28 border-t border-line/12 pt-14">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">{t("test.eyebrow")}</p>
            <h2 className="headline mt-2 text-3xl text-ink sm:text-5xl">{t("rev.title")}</h2>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="btn-ghost shrink-0 px-6 py-3 text-[11px]"
          >
            {showForm ? t("rev.closeBtn") : t("rev.write")}
          </button>
        </div>
      </Reveal>

      {showForm && (
        <div className="mt-7 max-w-2xl">
          <ReviewForm productId={productId} onClose={() => setShowForm(false)} />
        </div>
      )}

      {reviewCount > 0 ? (
        <div className="mt-9 grid gap-8 lg:grid-cols-[280px_1fr] lg:gap-12">
          {/* ------------------------- Resumen ------------------------- */}
          <Reveal variant="left">
            <div className="border-2 border-line/85 bg-surface p-6 shadow-hard-sm lg:sticky lg:top-28">
              <div className="flex items-end gap-3">
                <span className="tnum font-display text-6xl leading-none text-brand">
                  {ratingAvg.toFixed(1)}
                </span>
                <div className="pb-1.5">
                  <Stars rating={ratingAvg} className="h-3.5 w-3.5" />
                  <p className="tnum mt-1 font-mono text-[10px] uppercase tracking-widest2 text-ink-muted">
                    {reviewCount} {reviewCount === 1 ? t("rev.one") : t("rev.many")}
                  </p>
                </div>
              </div>

              {/* Desglose por estrellas. */}
              <div className="mt-5 space-y-2">
                {breakdown.map(({ star, n }) => {
                  const pct = reviewCount ? (n / reviewCount) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-2.5">
                      <span className="tnum w-3 font-mono text-[10px] text-ink-muted">
                        {star}
                      </span>
                      <svg className="h-2.5 w-2.5 shrink-0 text-brand" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="m12 2 3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01z" />
                      </svg>
                      <div className="h-1.5 flex-1 overflow-hidden bg-fill/8">
                        <div
                          className="h-full bg-accent-400/80"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="tnum w-5 text-right font-mono text-[10px] text-ink-muted">
                        {n}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Reveal>

          {/* --------------------------- Lista -------------------------- */}
          <div className="grid gap-px bg-line/10 sm:grid-cols-2">
            {reviews.map((r: any, i: number) => (
              <Reveal key={r.id} delay={Math.min(i, 5) * 70}>
                <figure className="flex h-full flex-col bg-night p-6">
                  <div className="flex items-center justify-between gap-2">
                    <Stars rating={r.rating} className="h-3.5 w-3.5" />
                    {r.createdAt && (
                      <span className="tnum font-mono text-[10px] text-ink-muted">
                        {new Date(r.createdAt).toLocaleDateString("es-NI")}
                      </span>
                    )}
                  </div>
                  <blockquote className="mt-4 flex-1 text-[14px] leading-relaxed text-ink-soft">
                    “{r.text}”
                  </blockquote>
                  <figcaption className="mt-5 flex items-center gap-3 border-t border-line/10 pt-4">
                    <span className="flex h-9 w-9 items-center justify-center bg-accent-400 font-display text-sm text-[#17130a]">
                      {initials(r.name)}
                    </span>
                    <span className="text-[13px] font-bold text-ink">
                      {r.name || "Cliente"}
                    </span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-9 border border-dashed border-line/20 px-6 py-14 text-center">
          <p className="text-[14px] text-ink-muted">{t("rev.empty")}</p>
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="btn-accent mt-6 px-6">
              {t("rev.write")}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
