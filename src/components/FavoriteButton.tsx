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

  // Geometría recta como el resto del sistema (nada de círculos), y el corazón
  // activo en BRASA — el mismo color que las ofertas y la urgencia, para que
  // "lo que me importa" y "lo que se me escapa" hablen el mismo idioma.
  const base =
    variant === "overlay"
      ? // Sobre la foto: siempre oscuro translúcido, sin depender del tema.
        // Aparece al pasar el cursor en escritorio; en móvil queda visible.
        "absolute right-0 top-0 z-10 flex h-9 w-9 items-center justify-center bg-night/70 text-ink backdrop-blur-sm transition-all duration-200 hover:bg-night/90 active:scale-90 md:opacity-0 md:group-hover:opacity-100"
      : // En la ficha (sobre superficie): se adapta al tema.
        "flex h-[54px] w-[54px] shrink-0 items-center justify-center border border-line/20 text-ink-soft transition-all duration-200 hover:border-ember-400 hover:text-ember-400 active:translate-y-px";

  return (
    <button
      type="button"
      onClick={handle}
      aria-pressed={active}
      aria-label={active ? "Quitar de favoritos" : "Guardar en favoritos"}
      title={active ? "Quitar de favoritos" : "Guardar en favoritos"}
      className={`${base} ${active ? "!text-ember-400 md:!opacity-100" : ""} ${className}`}
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
