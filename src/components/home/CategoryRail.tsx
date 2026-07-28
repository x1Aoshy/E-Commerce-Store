"use client";

import { useMemo } from "react";
import Reveal from "@/components/Reveal";
import SmartImage from "@/components/SmartImage";
import { useLang } from "@/context/LanguageContext";
import { productImages, isVideo } from "@/lib/images";
import type { Product } from "@/lib/types";

/* ==========================================================================
   COMPRÁ POR OBJETIVO
   --------------------------------------------------------------------------
   El cliente de suplementos casi nunca busca "Proteínas": busca "quiero ganar
   masa" o "quiero recuperarme mejor". Estos mosaicos traducen las categorías
   reales del catálogo a esa intención.

   TODO sale de datos reales: la foto es la del producto más caro con stock de
   la categoría (el que mejor la representa) y el contador es el conteo real.
   Si una categoría no existe en el catálogo, el mosaico no aparece. Nunca
   inventamos secciones vacías.
   ========================================================================== */

function goCategory(cat: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("titan:category", { detail: cat }));
  document.getElementById("productos")?.scrollIntoView({ behavior: "smooth" });
}

export default function CategoryRail({ products }: { products: Product[] }) {
  const { t } = useLang();

  const tiles = useMemo(() => {
    const byCat = new Map<string, Product[]>();
    for (const p of products) {
      if (!p.category) continue;
      const arr = byCat.get(p.category) || [];
      arr.push(p);
      byCat.set(p.category, arr);
    }

    return Array.from(byCat.entries())
      .map(([cat, list]) => {
        // Representante: con stock y el de mayor precio (suele ser el buque
        // insignia y la mejor foto del grupo).
        const hero =
          [...list]
            .filter((p) => (Number(p.stock) || 0) > 0)
            .sort((a, b) => Number(b.price) - Number(a.price))[0] || list[0];
        const img = productImages(hero).find((u: string) => !isVideo(u)) || "";
        return { cat, count: list.length, img };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [products]);

  if (tiles.length === 0) return null;

  return (
    <section className="py-14 sm:py-20">
      <div className="container-content">
        <Reveal>
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="eyebrow">{t("cat.eyebrow")}</p>
              <h2 className="headline mt-2 max-w-xl text-3xl text-ink sm:text-[2.75rem]">
                {t("cat.heading")}
              </h2>
            </div>
            {/* Número gigante contorneado: recurso de póster, peso visual cero. */}
            <span className="headline hidden text-7xl text-outline lg:block" aria-hidden="true">
              01
            </span>
          </div>
        </Reveal>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {tiles.map((tile, i) => (
            <Reveal key={tile.cat} delay={i * 90} variant="up">
              <button
                onClick={() => goCategory(tile.cat)}
                className="group relative flex aspect-[4/5] w-full flex-col justify-end overflow-hidden border border-line/12 bg-surface p-4 text-left transition-all duration-300 hover:border-accent-400 sm:p-5"
              >
                {/* Foto de fondo a plena intensidad: se acerca lento al pasar
                    el cursor. El velo oscuro va SIEMPRE (no depende del tema)
                    porque el texto se apoya en la foto, y una foto clara con
                    texto claro no se lee en ningún modo. */}
                {tile.img && (
                  <div className="absolute inset-0">
                    <SmartImage
                      src={tile.img}
                      alt=""
                      sizes="(max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-110"
                    />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/15 transition-opacity duration-500 group-hover:from-black/95" />

                {/* Contador de la categoría, arriba a la derecha. */}
                <span className="tnum absolute right-3 top-3 z-10 font-mono text-[10px] font-bold uppercase tracking-widest2 text-white/55">
                  {tile.count.toString().padStart(2, "0")}
                </span>

                <div className="relative z-10">
                  <h3 className="headline text-2xl text-white sm:text-3xl">{tile.cat}</h3>
                  <span className="mt-2 inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest2 text-accent-300">
                    {t("cat.see")}
                    <svg
                      width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"
                      className="transition-transform duration-300 group-hover:translate-x-1.5"
                      aria-hidden="true"
                    >
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </span>
                </div>
              </button>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
