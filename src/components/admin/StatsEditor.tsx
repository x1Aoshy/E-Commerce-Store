"use client";

// Editor de estadísticas por producto: hasta 6 métricas {label, value 0-100}
// que alimentan los anillos del perfil del producto. `value` es el arreglo
// actual; `onChange(next)` recibe el arreglo nuevo. Plano, oscuro y compacto.

const MAX = 6;
const QUICK_FILL = ["Pureza", "Absorción", "Calidad", "Valor"];

function clamp(n) {
  const v = Math.round(Number(n) || 0);
  return Math.max(0, Math.min(100, v));
}

export default function StatsEditor({ value = [], onChange }) {
  const rows = Array.isArray(value) ? value : [];
  const atMax = rows.length >= MAX;

  function update(idx, patch) {
    onChange(rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  function removeRow(idx) {
    onChange(rows.filter((_, i) => i !== idx));
  }

  function addRow() {
    if (atMax) return;
    onChange([...rows, { label: "", value: 80 }]);
  }

  function quickFill() {
    onChange(QUICK_FILL.map((label) => ({ label, value: 85 })));
  }

  return (
    <div>
      {rows.length === 0 ? (
        // Estado vacío: relleno rápido con las métricas por defecto.
        <div className="rounded-[4px] border border-dashed border-white/15 bg-white/[0.02] p-4 text-center">
          <p className="text-xs text-ink-muted">
            Sin métricas. El producto usará una valoración automática.
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {QUICK_FILL.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => onChange([...rows, { label, value: 85 }])}
                className="rounded-[4px] border border-white/15 bg-white/[0.04] px-2.5 py-1 text-[12px] font-medium text-ink-soft transition hover:border-accent-400 hover:text-accent-300"
              >
                + {label}
              </button>
            ))}
            <button
              type="button"
              onClick={quickFill}
              className="rounded-[4px] border border-accent-500/40 bg-accent-500/10 px-2.5 py-1 text-[12px] font-medium text-accent-300 transition hover:bg-accent-500/20"
            >
              Usar las 4
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {rows.map((row, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 rounded-[4px] border border-white/10 bg-white/[0.03] p-2"
            >
              <input
                className="input min-w-0 flex-1 px-2.5 py-1.5 text-[13px]"
                value={row.label}
                maxLength={30}
                onChange={(e) => update(idx, { label: e.target.value })}
                placeholder="Métrica (ej: Pureza)"
              />
              <input
                type="range"
                min={0}
                max={100}
                value={clamp(row.value)}
                onChange={(e) => update(idx, { value: clamp(e.target.value) })}
                aria-label={`Valor de ${row.label || "métrica"}`}
                className="stats-range h-1.5 w-24 shrink-0 cursor-pointer appearance-none rounded-full bg-white/15 accent-accent-500 sm:w-32"
              />
              <input
                type="number"
                min={0}
                max={100}
                value={clamp(row.value)}
                onChange={(e) => update(idx, { value: clamp(e.target.value) })}
                aria-label={`Valor numérico de ${row.label || "métrica"}`}
                className="w-14 shrink-0 rounded-[4px] border border-white/15 bg-transparent px-2 py-1.5 text-center text-[13px] tabular-nums text-ink outline-none focus:border-accent-400"
              />
              <button
                type="button"
                onClick={() => removeRow(idx)}
                aria-label="Quitar métrica"
                title="Quitar"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] text-ink-muted ring-1 ring-white/10 transition hover:text-red-300 hover:ring-red-500/40"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={addRow}
          disabled={atMax}
          className="rounded-[4px] border border-white/15 bg-white/[0.04] px-3 py-1.5 text-[12px] font-medium text-ink-soft transition hover:border-accent-400 hover:text-accent-300 disabled:pointer-events-none disabled:opacity-40"
        >
          + Agregar métrica
        </button>
        <span className="text-[11px] text-ink-muted">
          {rows.length}/{MAX}
        </span>
      </div>
    </div>
  );
}
