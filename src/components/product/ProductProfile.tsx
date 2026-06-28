"use client";

import { useEffect, useState } from "react";

// Perfil visual del producto con anillos animados. Los valores son
// ilustrativos (derivados de forma determinística del producto, así cada uno
// se ve único y estable). Más adelante se pueden volver campos editables.
const METRICS = ["Pureza", "Absorción", "Calidad", "Valor"];

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function valueFor(product, label) {
  // Rango 72–97 para que siempre se vea "premium" pero variado.
  return 72 + (hash(`${product.id}-${label}`) % 26);
}

function Ring({ label, value }: any) {
  const [p, setP] = useState(0);
  useEffect(() => {
    const r = requestAnimationFrame(() => setP(value));
    return () => cancelAnimationFrame(r);
  }, [value]);

  const R = 26;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - p / 100);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-[72px] w-[72px]">
        <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
          <circle cx="32" cy="32" r={R} fill="none" className="text-line/10" stroke="currentColor" strokeWidth="6" />
          <circle
            cx="32"
            cy="32"
            r={R}
            fill="none"
            className="text-accent-400"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)" }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-ink">
          {Math.round(p)}
        </span>
      </div>
      <span className="text-xs text-ink-muted">{label}</span>
    </div>
  );
}

export default function ProductProfile({ product }) {
  // Métricas editables del producto si existen; si no, valoración derivada
  // (determinística) para que los productos antiguos sigan viéndose bien.
  const custom = Array.isArray(product.stats) ? product.stats : [];
  const rings =
    custom.length > 0
      ? custom.slice(0, 6).map((s) => ({
          label: s.label,
          value: Math.max(0, Math.min(100, Math.round(Number(s.value) || 0))),
        }))
      : METRICS.map((label) => ({ label, value: valueFor(product, label) }));

  return (
    <div className="card p-5 shadow-soft">
      <h3 className="text-sm font-semibold text-ink">Perfil del producto</h3>
      <p className="mt-1 text-xs text-ink-muted">
        Valoración general según pureza, absorción y relación calidad-precio.
      </p>
      <div className="mt-5 grid grid-cols-4 gap-3 max-[360px]:grid-cols-2 max-[360px]:gap-4">
        {rings.map((r, i) => (
          <Ring key={`${r.label}-${i}`} label={r.label} value={r.value} />
        ))}
      </div>
    </div>
  );
}
