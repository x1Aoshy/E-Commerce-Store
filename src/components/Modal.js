"use client";

import { useEffect } from "react";

// Modal centrado y robusto en cualquier pantalla. La tarjeta se limita a 90% del
// alto VISIBLE (dvh, así el teclado del celular no la desborda), es una columna
// flex: cabecera fija (no scrollea) + cuerpo scrolleable. En desktop queda
// centrada y prolija; en mobile el cuerpo scrollea y el campo enfocado se ve.
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className={`card relative flex max-h-[90dvh] w-full ${maxW} flex-col overflow-hidden rounded-[4px] shadow-card animate-scale-in`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line/10 px-5 py-3.5">
          <h3 className="text-base font-semibold text-ink">{title}</h3>
          <button
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] text-ink-soft transition hover:bg-fill/10 hover:text-ink"
            aria-label="Cerrar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
