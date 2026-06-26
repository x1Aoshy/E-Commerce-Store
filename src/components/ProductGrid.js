"use client";

import { useEffect, useMemo, useState } from "react";
import ProductCard from "./ProductCard";
import Reveal from "./Reveal";
import { useFavorites } from "@/context/FavoritesContext";

export default function ProductGrid({ products }) {
  const { ids: favIds, count: favCount, hydrated } = useFavorites();
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
    <section id="productos" className="container-content py-16 sm:py-20">
      <Reveal className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-ink sm:text-3xl">
            Nuestros productos
          </h2>
          <p className="mt-2 text-ink-soft">
            Elegí tu suplemento y sumalo al carrito. Confirmás por WhatsApp.
          </p>
        </div>

        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          {hasSales && (
            <button
              onClick={() => setOnlySale((v) => !v)}
              className={`chip shrink-0 whitespace-nowrap px-3.5 py-1.5 transition active:scale-95 ${
                onlySale
                  ? "bg-accent-500 text-night"
                  : "bg-accent-500/10 text-accent-300 ring-1 ring-accent-500/30 hover:ring-accent-500/50"
              }`}
            >
              🔥 Ofertas
            </button>
          )}
          {hydrated && favCount > 0 && (
            <button
              onClick={() => setOnlyFav((v) => !v)}
              className={`chip shrink-0 whitespace-nowrap px-3.5 py-1.5 transition active:scale-95 ${
                onlyFav
                  ? "bg-red-500 text-white"
                  : "bg-white/5 text-ink-soft ring-1 ring-white/10 hover:ring-white/30"
              }`}
            >
              ♥ Favoritos ({favCount})
            </button>
          )}
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={`chip shrink-0 whitespace-nowrap px-3.5 py-1.5 transition active:scale-95 ${
                active === c
                  ? "bg-accent-500 text-night"
                  : "bg-white/5 text-ink-soft ring-1 ring-white/10 hover:ring-white/30"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </Reveal>

      {/* Buscador + orden: filtra por texto y ordena por precio. */}
      <Reveal className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
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
            placeholder="Buscar productos…"
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
          <option value="destacados">Más relevantes</option>
          <option value="precio-asc">Precio: menor a mayor</option>
          <option value="precio-desc">Precio: mayor a menor</option>
        </select>
      </Reveal>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p, i) => (
          <Reveal key={p.id} delay={Math.min(i * 60, 360)}>
            <ProductCard product={p} />
          </Reveal>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-12 text-center text-ink-muted">
          {onlyFav
            ? "Todavía no guardaste favoritos. Tocá el corazón ♥ en los productos que te gusten."
            : "No hay productos que coincidan con tu búsqueda."}
        </p>
      )}
    </section>
  );
}
