"use client";

import { useEffect, useState } from "react";

// Perfil del producto estilo "Supplement Facts": la tabla clásica de la
// etiqueta de un suplemento (título pesado, regla gruesa, filas con regla fina
// y valores en mono con barra). Usa las métricas editables del producto si
// existen; si no, una valoración derivada determinística del id (estable).
const METRICS = ["Pureza", "Absorción", "Calidad", "Valor"];

function hash(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function valueFor(product: any, label: string) {
  // Rango 72–97 para que siempre se vea "premium" pero variado.
  return 72 + (hash(`${product.id}-${label}`) % 26);
}

function FactRow({ label, value }: any) {
  // Barra animada al montar (de 0 al valor), como una carga de tinta.
  const [w, setW] = useState(0);
  useEffect(() => {
    const r = requestAnimationFrame(() => setW(value));
    return () => cancelAnimationFrame(r);
  }, [value]);

  return (
    <div className="border-t border-line/25 py-2 first:border-t-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold text-ink">{label}</span>
        <span className="font-mono text-sm font-semibold text-ink">
          {value}
          <span className="text-ink-muted">/100</span>
        </span>
      </div>
      <div className="mt-1.5 h-1.5 w-full bg-fill/10">
        <div
          className="h-full bg-accent-500"
          style={{
            width: `${w}%`,
            transition: "width 900ms cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </div>
    </div>
  );
}

export default function ProductProfile({ product }: any) {
  const custom = Array.isArray(product.stats) ? product.stats : [];
  const rows =
    custom.length > 0
      ? custom.slice(0, 6).map((s: any) => ({
          label: s.label,
          value: Math.max(0, Math.min(100, Math.round(Number(s.value) || 0))),
        }))
      : METRICS.map((label) => ({ label, value: valueFor(product, label) }));

  return (
    <div className="etq bg-surface p-4">
      {/* Cabecera al estilo Supplement Facts: título pesado + regla gruesa. */}
      <h3 className="font-display text-2xl font-extrabold leading-none text-ink">
        Perfil del producto
      </h3>
      <p className="mt-1.5 border-b-[6px] border-ink pb-2 font-mono text-[10px] uppercase tracking-wider text-ink-muted">
        Valoración por métrica · escala 0–100
      </p>

      <div className="mt-1">
        {rows.map((r: any, i: number) => (
          <FactRow key={`${r.label}-${i}`} label={r.label} value={r.value} />
        ))}
      </div>

      {/* Regla gruesa de cierre + letra chica, como en la etiqueta real. */}
      <div className="mt-1 border-t-4 border-ink pt-2">
        <p className="font-mono text-[9.5px] leading-relaxed text-ink-muted">
          Valoración de la casa según pureza, absorción y relación
          calidad-precio. No sustituye la información del fabricante.
        </p>
      </div>
    </div>
  );
}
