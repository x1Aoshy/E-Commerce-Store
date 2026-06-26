"use client";

import { useFavorites } from "@/context/FavoritesContext";

// Botón de "me gusta" (corazón) reutilizable. Guarda el favorito en el
// navegador (sin cuentas). `variant`:
//   - "overlay": flotante sobre la imagen de la tarjeta (arriba a la derecha).
//   - "inline":  botón cuadrado al lado del precio en la ficha del producto.
export default function FavoriteButton({ id, variant = "overlay", className = "" }) {
  const { isFav, toggle, hydrated } = useFavorites();
  // Hasta hidratar mostramos el corazón vacío (evita desajuste server/cliente).
  const active = hydrated && isFav(id);

  const handle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(id);
  };

  const base =
    variant === "overlay"
      ? "absolute right-2.5 top-2.5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-night/55 text-ink backdrop-blur-sm ring-1 ring-white/15 transition hover:bg-night/75 active:scale-90"
      : "flex h-12 w-12 items-center justify-center rounded-[3px] border border-white/15 text-ink-soft transition hover:border-white/30 hover:text-ink active:scale-95";

  return (
    <button
      type="button"
      onClick={handle}
      aria-pressed={active}
      aria-label={active ? "Quitar de favoritos" : "Guardar en favoritos"}
      title={active ? "Quitar de favoritos" : "Guardar en favoritos"}
      className={`${base} ${active ? "!text-red-400" : ""} ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className={`h-5 w-5 transition-transform ${active ? "scale-110" : ""}`}
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
      </svg>
    </button>
  );
}
