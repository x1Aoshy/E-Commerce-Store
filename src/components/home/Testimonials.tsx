"use client";

import { useMemo } from "react";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import Marquee from "@/components/motion/Marquee";
import CountUp from "@/components/motion/CountUp";
import { useLang } from "@/context/LanguageContext";
import type { Product } from "@/lib/types";

/* ==========================================================================
   LO QUE DICEN LOS CLIENTES
   --------------------------------------------------------------------------
   Reseñas REALES y aprobadas, tomadas de los productos del catálogo
   (`featuredReview`, que ya viene calculada por la capa de datos). Si todavía
   no hay ninguna reseña, la sección entera desaparece: un muro de testimonios
   vacío o inventado hace más daño que no tener ninguno.

   Van en una cinta que corre sola y se detiene al pasar el cursor, para poder
   leer la que llamó la atención. El movimiento constante hace que el ojo
   registre "mucha gente compró acá" antes de leer una sola palabra.
   ========================================================================== */

function Stars({ rating = 5 }: { rating?: number }) {
  return (
    <span className="inline-flex gap-0.5 text-brand" aria-label={`${rating} de 5`}>
      {Array.from({ length: 5 }).map((_, s) => (
        <svg
          key={s}
          viewBox="0 0 24 24"
          className={`h-3.5 w-3.5 ${s < Math.round(rating) ? "" : "text-line/20"}`}
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="m12 2 3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01z" />
        </svg>
      ))}
    </span>
  );
}

export default function Testimonials({ products }: { products: Product[] }) {
  const { t } = useLang();

  const reviews = useMemo(
    () =>
      products
        .filter((p) => p.featuredReview && p.featuredReview.text)
        .map((p) => ({
          key: p.id,
          slug: p.slug,
          product: p.name,
          ...p.featuredReview!,
        }))
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 10),
    [products]
  );

  // Promedio global y total de reseñas: los dos números que la gente busca.
  const summary = useMemo(() => {
    const withReviews = products.filter((p) => (p.reviewCount || 0) > 0);
    const total = withReviews.reduce((s, p) => s + (p.reviewCount || 0), 0);
    const weighted = withReviews.reduce(
      (s, p) => s + (p.ratingAvg || 0) * (p.reviewCount || 0),
      0
    );
    return { total, avg: total ? weighted / total : 0 };
  }, [products]);

  if (reviews.length === 0) return null;

  return (
    <section className="overflow-hidden py-14 sm:py-20">
      <div className="container-content">
        <Reveal>
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">{t("test.eyebrow")}</p>
              <h2 className="headline mt-2 max-w-2xl text-3xl text-ink sm:text-[2.75rem]">
                {t("test.heading")}
              </h2>
            </div>

            {/* Resumen numérico: promedio + total, calculados de verdad. */}
            <div className="flex shrink-0 items-center gap-4 border border-line/15 px-5 py-4">
              <span className="tnum font-display text-4xl leading-none text-brand">
                <CountUp to={summary.avg} decimals={1} />
              </span>
              <span className="h-10 w-px bg-line/15" aria-hidden="true" />
              <div>
                <Stars rating={summary.avg} />
                <p className="tnum mt-1 font-mono text-[10px] uppercase tracking-widest2 text-ink-muted">
                  {t("test.based", { n: summary.total })}
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      {/* Cinta de reseñas. Duplicamos la lista si son pocas, para que la pista
          sea siempre más ancha que la pantalla y el bucle no se note. */}
      <div className="mt-10">
        <Marquee speed={reviews.length > 5 ? 60 : 42} itemClassName="px-2.5">
          {(reviews.length < 4 ? [...reviews, ...reviews, ...reviews] : reviews).map(
            (r, i) => (
              <Link
                key={`${r.key}-${i}`}
                href={`/producto/${r.slug}#resenas`}
                className="flex h-full w-[300px] flex-col justify-between border border-line/12 bg-surface p-5 transition-colors duration-300 hover:border-accent-400/50 sm:w-[350px]"
              >
                <div>
                  <Stars rating={r.rating} />
                  <p className="mt-3 line-clamp-4 text-[13.5px] leading-relaxed text-ink-soft">
                    “{r.text}”
                  </p>
                </div>
                <div className="mt-5 flex items-center gap-3 border-t border-line/10 pt-4">
                  {/* Avatar de inicial: honesto (no hay foto) y con carácter. */}
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-accent-400 font-display text-base text-[#17130a]">
                    {(r.name || "?").trim().charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[12.5px] font-bold text-ink">
                      {r.name || t("test.anon")}
                    </p>
                    <p className="truncate font-mono text-[9.5px] uppercase tracking-widest2 text-ink-muted">
                      {r.product}
                    </p>
                  </div>
                </div>
              </Link>
            )
          )}
        </Marquee>
      </div>
    </section>
  );
}
