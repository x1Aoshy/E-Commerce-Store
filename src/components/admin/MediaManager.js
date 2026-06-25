"use client";

import { useRef, useState } from "react";
import { isVideo } from "@/lib/images";

// Gestor de medios para el admin: sube imágenes/videos al servidor (Supabase
// Storage) y permite quitarlos y reordenar la portada. `value` es un arreglo de
// URLs; `onChange` recibe el arreglo nuevo.
export default function MediaManager({ value = [], onChange }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const items = Array.isArray(value) ? value : [];

  async function handleFiles(fileList) {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    setBusy(true);
    setError(null);
    const added = [];
    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.url) added.push(data.url);
        else setError(data.error || "No se pudo subir un archivo.");
      } catch {
        setError("Error de conexión al subir.");
      }
    }
    if (added.length) onChange([...items, ...added]);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function remove(url) {
    onChange(items.filter((u) => u !== url));
  }

  function makeCover(url) {
    onChange([url, ...items.filter((u) => u !== url)]);
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {items.map((url, idx) => (
          <div
            key={url}
            className="group relative aspect-square overflow-hidden rounded-lg border border-white/10 bg-surface-soft"
          >
            {isVideo(url) ? (
              <video src={url} className="h-full w-full object-cover" muted playsInline preload="metadata" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt="" className="h-full w-full object-cover" />
            )}

            {idx === 0 && (
              <span className="absolute left-1 top-1 rounded-[3px] bg-night/80 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-accent-300">
                Portada
              </span>
            )}

            <div className="absolute inset-x-1 bottom-1 flex items-center justify-between gap-1 opacity-0 transition group-hover:opacity-100">
              {idx !== 0 ? (
                <button
                  type="button"
                  onClick={() => makeCover(url)}
                  title="Usar como portada"
                  className="rounded-[3px] bg-night/80 px-1.5 py-0.5 text-[9px] font-medium text-ink-soft ring-1 ring-white/15 transition hover:text-accent-300"
                >
                  Portada
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={() => remove(url)}
                aria-label="Quitar"
                title="Quitar"
                className="flex h-6 w-6 items-center justify-center rounded-[3px] bg-night/80 text-ink-soft ring-1 ring-white/15 transition hover:text-red-300"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-white/20 text-ink-muted transition hover:border-accent-400 hover:text-accent-300 disabled:opacity-50"
        >
          {busy ? (
            <span className="text-[11px]">Subiendo…</span>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span className="text-[11px]">Agregar</span>
            </>
          )}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/mp4,video/webm"
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
      <p className="mt-2 text-[11px] text-ink-muted">
        Hasta 15 MB por archivo. La primera es la portada (tocá “Portada” para cambiarla).
      </p>
    </div>
  );
}
