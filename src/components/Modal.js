"use client";

import { useEffect } from "react";

// Modal reutilizable. Clave para mobile: el SCRIM ocupa toda la pantalla y
// scrollea ÉL MISMO (overflow-y-auto). Así el contenido alto (ej. el form de
// producto) siempre se alcanza y, al enfocar un campo, el navegador desplaza el
// input para que el teclado no lo tape. Modales cortos quedan centrados; los
// altos arrancan arriba (con `min-h-full items-center`), así el primer campo
// (el nombre) se ve apenas abre. Cabecera pegajosa con el botón de cerrar.
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
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/60"
      onClick={onClose}
    >
      <div className="flex min-h-full items-center justify-center p-3 sm:p-6">
        <div
          className={`card relative flex w-full ${maxW} flex-col rounded-[4px] shadow-card animate-scale-in`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 z-10 flex items-center justify-between gap-3 rounded-t-[4px] border-b border-white/10 bg-surface px-5 py-3.5">
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
            className="px-5 py-4"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
