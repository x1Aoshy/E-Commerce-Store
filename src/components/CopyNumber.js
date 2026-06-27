"use client";

import { useState } from "react";
import { useBranding } from "@/context/BrandingContext";

// Muestra el número de WhatsApp como texto COPIABLE. Útil en PC, donde el chat
// puede no abrirse: el cliente copia el número y te escribe desde su teléfono.
export default function CopyNumber({ className = "" }) {
  const { whatsappNumber } = useBranding();
  const number = (whatsappNumber || "").replace(/[^\d]/g, "");
  const [copied, setCopied] = useState(false);
  if (!number) return null;

  const pretty = `+${number}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(pretty);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copiar número de WhatsApp ${pretty}`}
      className={`inline-flex items-center gap-2 rounded-[4px] border border-line/15 px-3 py-2 text-[13px] font-medium text-ink-soft transition hover:border-line/30 hover:text-ink active:scale-95 ${className}`}
    >
      <span className="tabular-nums text-ink">{pretty}</span>
      {copied ? (
        <span className="inline-flex items-center gap-1 text-green-400">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12l5 5L20 6" />
          </svg>
          Copiado
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-ink-muted">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="9" y="9" width="11" height="11" rx="2" />
            <path d="M5 15V5a2 2 0 0 1 2-2h10" />
          </svg>
          Copiar
        </span>
      )}
    </button>
  );
}
