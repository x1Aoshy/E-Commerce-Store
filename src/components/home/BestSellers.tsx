"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import { useLang } from "@/context/LanguageContext";
import type { Product } from "@/lib/types";

/* ==========================================================================
   LOS MÁS PEDIDOS · carrusel horizontal
   --------------------------------------------------------------------------
   Antes de la rejilla completa hay que poner una selección corta y fuerte: el
   cliente que llega sin saber qué quiere necesita que le señalen 6 opciones,
   no 40. El desplazamiento horizontal con `snap` es el patrón que la gente ya
   sabe usar de memoria en el móvil.

   El orden sale de datos reales: primero los destacados por el dueño, después
   los mejor puntuados por clientes, y como desempate el que más reseñas tiene.
   ========================================================================== */

export default function BestSellers({ products }: { products: Product[] }) {
  const { t } = useLang();
  const railRef = useRef<HTMLDivElement | null>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const picks = useMemo(() => {
    return [...products]
      .filter((p) => (Number(p.stock) || 0) > 0)
      .sort((a, b) => {
        const feat = Number(!!b.featured) - Number(!!a.featured);
        if (feat !== 0) return feat;
        const rating = (Number(b.ratingAvg) || 0) - (Number(a.ratingAvg) || 0);
        if (rating !== 0) return rating;
        return (Number(b.reviewCount) || 0) - (Number(a.reviewCount) || 0);
      })
      .slice(0, 8);
  }, [products]);

  // Estado de las flechas: se apagan en los extremos en vez de quedar
  // encendidas sin hacer nada.
  const syncArrows = () => {
    const el = railRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  };

  useEffect(() => {
    syncArrows();
    const el = railRef.current;
    if (!el) return;
    el.addEventListener("scroll", syncArrows, { passive: true });
    window.addEventListener("resize", syncArrows);
    return () => {
      el.removeEventListener("scroll", syncArrows);
      window.removeEventListener("resize", syncArrows);
    };
  }, [picks.length]);

  const scrollBy = (dir: -1 | 1) => {
    const el = railRef.current;
    if (!el) return;
    // Avanza "una pantalla menos un poco", para que quede una tarjeta a la
    // vista y se entienda que hay continuidad.
    el.scrollBy({ left: dir * (el.clientWidth * 0.82), behavior: "smooth" });
  };

  if (picks.length < 3) return null;

  const Arrow = ({ dir, disabled }: { dir: -1 | 1; disabled: boolean }) => (
    <button
      type="button"
      onClick={() => scrollBy(dir)}
      disabled={disabled}
      aria-label={dir === -1 ? t("rail.prev") : t("rail.next")}
      className="flex h-11 w-11 items-center justify-center border border-line/20 text-ink transition-all duration-200 hover:border-accent-400 hover:bg-accent-400 hover:text-[#17130a] disabled:pointer-events-none disabled:opacity-25"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d={dir === -1 ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
      </svg>
    </button>
  );

  return (
    <section className="overflow-hidden border-y border-line/10 bg-surface-soft/50 py-14 sm:py-20">
      <div className="container-content">
        <Reveal>
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="eyebrow">{t("rail.eyebrow")}</p>
              <h2 className="headline mt-2 text-3xl text-ink sm:text-[2.75rem]">
                {t("rail.heading")}
              </h2>
            </div>
            <div className="hidden shrink-0 gap-2 sm:flex">
              <Arrow dir={-1} disabled={atStart} />
              <Arrow dir={1} disabled={atEnd} />
            </div>
          </div>
        </Reveal>
      </div>

      {/* El carril se sale del contenedor a propósito: la última tarjeta queda
          cortada por el borde y eso comunica "hay más" sin ninguna flecha. */}
      <div
        ref={railRef}
        className="no-scrollbar mt-9 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 sm:px-7 lg:px-10"
        style={{ scrollPaddingLeft: "1.25rem" }}
      >
        {picks.map((p, i) => (
          <div
            key={p.id}
            className="w-[70vw] shrink-0 snap-start border border-line/12 sm:w-[42vw] lg:w-[300px]"
          >
            <ProductCard product={p} priority={i < 2} />
          </div>
        ))}
        {/* Espaciador final: la última tarjeta puede llegar al borde sin
            pegarse al canto de la pantalla. */}
        <div className="w-1 shrink-0" aria-hidden="true" />
      </div>

      <div className="container-content mt-8 flex justify-center sm:hidden">
        <div className="flex gap-2">
          <Arrow dir={-1} disabled={atStart} />
          <Arrow dir={1} disabled={atEnd} />
        </div>
      </div>
    </section>
  );
}
