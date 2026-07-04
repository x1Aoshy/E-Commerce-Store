"use client";

import { useEffect, useMemo, useState } from "react";
import ProductCard from "./ProductCard";
import { useFavorites } from "@/context/FavoritesContext";
import { useLang } from "@/context/LanguageContext";
import type { Product } from "@/lib/types";

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
  const [sort, setSort] = useState("destacados"); // destacados | precio-asc | precio-desc

  // ¿Hay al menos un producto en oferta? (para mostrar el filtro "Ofertas").
  const hasSales = useMemo(
    () => products.some((p) => Number(p.compareAt) > Number(p.price)),
    [products]
  );

  // Sincroniza el filtro con la barra de categorías del header: escucha el
  // evento "titan:category" y, al cargar, lee ?categoria= de la URL.
  useEffect(() => {
    const valid = (cat) =>
      cat === "Todos" || products.some((p) => p.category === cat);
    const apply = (cat) => {
      if (cat && valid(cat)) {
        setActive(cat);
        setOnlySale(false);
        setOnlyFav(false);
      }
    };
    apply(new URLSearchParams(window.location.search).get("categoria"));
    const onCat = (e) => apply(e.detail);
    window.addEventListener("titan:category", onCat);
    return () => window.removeEventListener("titan:category", onCat);
  }, [products]);

  // Filtra por categoría activa, ofertas, favoritos Y el texto buscado (nombre,
  // descripción corta y categoría). Luego ordena según el criterio elegido.
  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    const list = products.filter((p) => {
      if (active !== "Todos" && p.category !== active) return false;
      if (onlySale && !(Number(p.compareAt) > Number(p.price))) return false;
      if (onlyFav && !favIds.includes(p.id)) return false;
      if (!q) return true;
      return [p.name, p.short, p.category]
        .filter(Boolean)
        .some((campo) => campo.toLowerCase().includes(q));
    });

    const sorted = [...list];
    if (sort === "precio-asc") sorted.sort((a, b) => a.price - b.price);
    else if (sort === "precio-desc") sorted.sort((a, b) => b.price - a.price);
    // "destacados": respeta el orden de entrada (más nuevos primero).
    return sorted;
  }, [products, active, onlySale, onlyFav, favIds, q, sort]);

  return (
    <section id="productos" className="container-content py-10 sm:py-14">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-baseline gap-3">
          <h2 className="text-2xl font-semibold text-ink sm:text-3xl">
            {t("grid.heading")}
          </h2>
          <span className="text-sm text-ink-muted">
            {filtered.length === 1
              ? t("grid.countOne")
              : t("grid.count", { n: filtered.length })}
          </span>
        </div>

        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          {hasSales && (
            <button
              onClick={() => setOnlySale((v) => !v)}
              className={`chip shrink-0 whitespace-nowrap px-3.5 py-1.5 transition active:scale-95 ${
                onlySale
                  ? "bg-accent-500 text-[#1a1306]"
                  : "bg-accent-500/10 text-accent-300 ring-1 ring-accent-500/30 hover:ring-accent-500/50"
              }`}
            >
              {t("grid.offers")}
            </button>
          )}
          {hydrated && favCount > 0 && (
            <button
              onClick={() => setOnlyFav((v) => !v)}
              className={`chip shrink-0 whitespace-nowrap px-3.5 py-1.5 transition active:scale-95 ${
                onlyFav
                  ? "bg-red-500 text-white"
                  : "bg-fill/5 text-ink-soft ring-1 ring-line/10 hover:ring-line/30"
              }`}
            >
              {t("grid.favorites")} ({favCount})
            </button>
          )}
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={`chip shrink-0 whitespace-nowrap px-3.5 py-1.5 transition active:scale-95 ${
                active === c
                  ? "bg-accent-500 text-[#1a1306]"
                  : "bg-fill/5 text-ink-soft ring-1 ring-line/10 hover:ring-line/30"
              }`}
            >
              {c === "Todos" ? t("grid.all") : c}
            </button>
          ))}
        </div>
      </div>

      {/* Buscador + orden: filtra por texto y ordena por precio. */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-md">
          <svg
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
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
            aria-label="Buscar productos"
            className="input pl-10"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="Ordenar productos"
          className="input sm:w-52"
        >
          <option value="destacados">{t("grid.sortRelevant")}</option>
          <option value="precio-asc">{t("grid.sortAsc")}</option>
          <option value="precio-desc">{t("grid.sortDesc")}</option>
        </select>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-12 text-center text-ink-muted">
          {onlyFav ? t("grid.emptyFav") : t("grid.empty")}
        </p>
      )}
    </section>
  );
}
