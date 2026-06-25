"use client";

import { useEffect } from "react";

// Modal reutilizable (sin glass): scrim oscuro sólido + tarjeta. En mobile sube
// como hoja desde abajo; en desktop aparece centrado con un scale-in suave.
// La tarjeta es una columna flex: cabecera fija (título + cerrar) y cuerpo
// scrolleable, así nunca supera el viewport visible y los botones se alcanzan.
export default function Modal({ open, onClose, title, children, maxW = "max-w-lg" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className={`card flex w-full ${maxW} max-h-[88dvh] animate-scale-in flex-col overflow-hidden rounded-[4px] shadow-card`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <h3 className="text-base font-semibold text-ink">{title}</h3>
          <button
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] text-ink-soft transition hover:bg-white/10 hover:text-ink"
            aria-label="Cerrar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div
          className="flex-1 overflow-y-auto px-5 py-4"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
