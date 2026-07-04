"use client";

// Perfil del producto: SOLO las métricas que el dueño escribió en el admin
// (editor de stats del producto). Si no definió ninguna, no se muestra nada —
// nunca inventamos números.
export default function ProductProfile({ product }) {
  const stats = (Array.isArray(product?.stats) ? product.stats : [])
    .map((s: any) => ({
      label: String(s?.label || "").trim(),
      value: Math.max(0, Math.min(100, Math.round(Number(s?.value) || 0))),
    }))
    .filter((s: any) => s.label)
    .slice(0, 6);

  if (stats.length === 0) return null;

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-ink">Perfil del producto</h3>
      <div className="mt-4 space-y-3.5">
        {stats.map((s: any, i: number) => (
          <div key={`${s.label}-${i}`}>
            <div className="flex items-baseline justify-between gap-3 text-xs">
              <span className="text-ink-soft">{s.label}</span>
              <span className="font-semibold text-ink">{s.value}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-fill/10">
              <div
                className="h-full rounded-full bg-accent-400"
                style={{ width: `${s.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
