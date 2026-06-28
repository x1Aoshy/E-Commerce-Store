"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/context/ThemeContext";

// Botón para cambiar el tema (sistema → claro → oscuro → sistema). Muestra el
// ícono del modo actual. Pensado para el header de la tienda.
export default function ThemeToggle({ className = "" }) {
  const { pref, cycleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // Evita desajuste de hidratación: hasta montar, mostramos un ícono neutro.
  useEffect(() => setMounted(true), []);

  const label =
    pref === "light"
      ? "Tema: claro"
      : pref === "dark"
      ? "Tema: oscuro"
      : "Tema: automático";

  return (
    <button
      type="button"
      onClick={cycleTheme}
      aria-label={`${label} (tocá para cambiar)`}
      title={label}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-[4px] border border-line/15 text-ink-soft transition hover:border-line/35 hover:bg-fill/5 hover:text-ink active:scale-95 ${className}`}
    >
      {!mounted ? (
        // Ícono neutro (semiluna) antes de hidratar.
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      ) : pref === "light" ? (
        // Sol
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : pref === "dark" ? (
        // Luna
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      ) : (
        // Automático (monitor)
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="13" rx="2" />
          <path d="M8 21h8M12 17v4" />
        </svg>
      )}
    </button>
  );
}
