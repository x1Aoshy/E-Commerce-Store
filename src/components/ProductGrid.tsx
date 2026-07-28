"use client";

import { useEffect, useMemo, useState } from "react";
import ProductCard from "./ProductCard";
import Reveal from "./Reveal";
import { useFavorites } from "@/context/FavoritesContext";
import { useLang } from "@/context/LanguageContext";
import type { Product } from "@/lib/types";

/* ==========================================================================
   CATÁLOGO
   --------------------------------------------------------------------------
   La barra de filtros es STICKY: en una tienda con muchos productos, perder
   los filtros al bajar obliga a volver arriba y ahí se abandona la sesión.

   La rejilla usa hairlines compartidas (`grid-rules`) en vez de tarjetas
   flotando separadas: se lee como un catálogo impreso, denso y ordenado. Es
   lo que más aleja el resultado del típico "grid de cards con sombra".
   ========================================================================== */

const SORTS = ["destacados", "precio-asc", "precio-desc", "nuevos"] as const;
type Sort = (typeof SORTS)[number];

export default function ProductGrid({ products }: { products: Product[] }) {
  const { ids: favIds, count: favCount, hydrated } = useFavorites();
  const { t } = useLang();

  const categories = useMemo(
    () => ["Todos", ...Array.from(new Set(products.map((p) => p.category)))],
    [products]
  );

  const [active, setActive] = useState("Todos");
  const [query, setQuery] = useState("");
  const [onlySale, setOnlySale] = useState(false);
  const [onlyFav, setOnlyFav] = useState(false);
  const [onlyStock, setOnlyStock] = useState(false);
  const [sort, setSort] = useState<Sort>("destacados");

  const hasSales = useMemo(
    () => products.some((p) => Number(p.compareAt) > Number(p.price)),
    [products]
  );

  /* --- Sincronía con el header: categoría, búsqueda y favoritos ---------- */
  useEffect(() => {
    const valid = (cat: string) =>
      cat === "Todos" || products.some((p) => p.category === cat);

    const applyCat = (cat: string) => {
      if (cat && valid(cat)) {
        setActive(cat);
        setOnlySale(false);
        setOnlyFav(false);
      }
    };

    // Estado inicial desde la URL (?categoria= y ?q=), para que un link
    // compartido por WhatsApp abra ya filtrado.
    const params = new URLSearchParams(window.location.search);
    applyCat(params.get("categoria") || "");
    const q0 = params.get("q");
    if (q0) setQuery(q0);

    const onCat = (e: any) => applyCat(e.detail);
    const onSearch = (e: any) => {
      setQuery(String(e.detail || ""));
      setActive("Todos");
    };
    const onFav = () => setOnlyFav(true);

    window.addEventListener("titan:category", onCat);
    window.addEventListener("titan:search", onSearch);
    window.addEventListener("titan:favorites", onFav);
    return () => {
      window.removeEventListener("titan:category", onCat);
      window.removeEventListener("titan:search", onSearch);
      window.removeEventListener("titan:favorites", onFav);
    };
  }, [products]);

  /* ------------------------------ Filtrado ------------------------------- */
  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    const list = products.filter((p) => {
      if (active !== "Todos" && p.category !== active) return false;
      if (onlySale && !(Number(p.compareAt) > Number(p.price))) return false;
      if (onlyFav && !favIds.includes(p.id)) return false;
      if (onlyStock && (Number(p.stock) || 0) <= 0) return false;
      if (!q) return true;
      return [p.name, p.short, p.category]
        .filter(Boolean)
        .some((campo) => campo.toLowerCase().includes(q));
    });

    const sorted = [...list];
    if (sort === "precio-asc") sorted.sort((a, b) => a.price - b.price);
    else if (sort === "precio-desc") sorted.sort((a, b) => b.price - a.price);
    else if (sort === "destacados")
      sorted.sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
    // "nuevos": respeta el orden de entrada (la base ya devuelve recientes primero).

    // Los agotados SIEMPRE al final: ocupan el mismo espacio que un producto
    // que sí se puede comprar, así que no pueden abrir la rejilla.
    return sorted.sort(
      (a, b) => Number((Number(b.stock) || 0) > 0) - Number((Number(a.stock) || 0) > 0)
    );
  }, [products, active, onlySale, onlyFav, onlyStock, favIds, q, sort]);

  const filtersOn = active !== "Todos" || onlySale || onlyFav || onlyStock || !!q;
  const clearAll = () => {
    setActive("Todos");
    setOnlySale(false);
    setOnlyFav(false);
    setOnlyStock(false);
    setQuery("");
  };

  return (
    <section id="productos" className="relative py-14 sm:py-20">
      <div className="container-content">
        {/* ---------------------------- Encabezado --------------------------- */}
        <Reveal>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">{t("grid.eyebrow")}</p>
              <h2 className="headline mt-2 text-3xl text-ink sm:text-[2.75rem]">
                {t("grid.heading")}
              </h2>
            </div>
            <p className="tnum font-mono text-[11px] uppercase tracking-widest2 text-ink-muted">
              {filtered.length === 1
                ? t("grid.countOne")
                : t("grid.count", { n: filtered.length })}
            </p>
          </div>
        </Reveal>

        <div className="mt-6 h-px w-full bg-line/12" />
      </div>

      {/* ------------------------- Barra de filtros ------------------------- */}
      {/* Sticky justo debajo del header: los filtros viajan con el cliente.
          En móvil el header mide 68px + la fila de categorías (~38px); en
          escritorio esa fila no existe y basta con los 68px. */}
      <div className="sticky top-[106px] z-20 mt-0 border-b border-line/10 bg-night py-3 lg:top-[68px]">
        <div className="container-content">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            {/* Buscador */}
            <div className="relative w-full lg:max-w-xs">
              <svg
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted"
                width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.2-3.2" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("grid.search")}
                aria-label={t("grid.search")}
                className="input h-11 min-h-0 pl-10 pr-9 text-sm"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  aria-label={t("grid.clear")}
                  className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center text-ink-muted transition-colors hover:text-ink"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              )}
            </div>

            {/* Chips: categorías + filtros rápidos. Deslizables en móvil. */}
            <div className="no-scrollbar -mx-5 flex flex-1 items-center gap-2 overflow-x-auto px-5 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setActive(c)}
                  className={`chip shrink-0 whitespace-nowrap ${
                    active === c ? "chip-on" : "chip-off"
                  }`}
                >
                  {c === "Todos" ? t("grid.all") : c}
                </button>
              ))}

              {hasSales && (
                <button
                  onClick={() => setOnlySale((v) => !v)}
                  className={`chip shrink-0 whitespace-nowrap ${
                    onlySale
                      ? "bg-ember-500 text-white ring-1 ring-ember-500"
                      : "bg-transparent text-urgent ring-1 ring-ember-500/40 hover:ring-ember-500"
                  }`}
                >
                  🔥 {t("grid.offers")}
                </button>
              )}

              {hydrated && favCount > 0 && (
                <button
                  onClick={() => setOnlyFav((v) => !v)}
                  className={`chip shrink-0 whitespace-nowrap ${
                    onlyFav ? "chip-on" : "chip-off"
                  }`}
                >
                  ♥ {t("grid.favorites")} ({favCount})
                </button>
              )}

              <button
                onClick={() => setOnlyStock((v) => !v)}
                className={`chip shrink-0 whitespace-nowrap ${
                  onlyStock ? "chip-on" : "chip-off"
                }`}
              >
                {t("grid.inStock")}
              </button>

              {filtersOn && (
                <button
                  onClick={clearAll}
                  className="shrink-0 whitespace-nowrap px-2 font-mono text-[10px] uppercase tracking-widest2 text-ink-muted underline underline-offset-4 transition-colors hover:text-ink"
                >
                  {t("grid.clear")}
                </button>
              )}
            </div>

            {/* Orden */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              aria-label={t("grid.sortLabel")}
              className="input h-11 min-h-0 w-full shrink-0 text-sm lg:w-48"
            >
              <option value="destacados">{t("grid.sortRelevant")}</option>
              <option value="nuevos">{t("grid.sortNew")}</option>
              <option value="precio-asc">{t("grid.sortAsc")}</option>
              <option value="precio-desc">{t("grid.sortDesc")}</option>
            </select>
          </div>
        </div>
      </div>

      {/* ----------------------------- Rejilla ----------------------------- */}
      <div className="container-content">
        {filtered.length > 0 ? (
          <div className="grid-rules mt-8 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p, i) => (
              <ProductCard
                key={p.id}
                product={p}
                // Las primeras cuatro fotos entran sin diferir: son las que
                // decide el LCP en escritorio.
                priority={i < 4}
              />
            ))}
          </div>
        ) : (
          <div className="mt-14 border border-dashed border-line/20 px-6 py-16 text-center">
            <p className="headline text-2xl text-ink-soft">{t("grid.emptyTitle")}</p>
            <p className="mx-auto mt-3 max-w-sm text-sm text-ink-muted">
              {onlyFav ? t("grid.emptyFav") : t("grid.empty")}
            </p>
            {filtersOn && (
              <button onClick={clearAll} className="btn-ghost mt-6 px-6">
                {t("grid.clear")}
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
