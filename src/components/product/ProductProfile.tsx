"use client";

import { useReveal } from "@/lib/useReveal";

/* ==========================================================================
   PERFIL DEL PRODUCTO
   --------------------------------------------------------------------------
   SÓLO las métricas que el dueño cargó en el admin. Si no definió ninguna, no
   se muestra nada — nunca inventamos números sobre un suplemento.

   Las barras se llenan cuando el bloque entra en pantalla, no al cargar la
   página: si se llenan fuera de vista, el cliente ve el resultado y se pierde
   la lectura de "esto mide tanto". Es la diferencia entre un dato y una
   demostración.
   ========================================================================== */

export default function ProductProfile({ product }: any) {
  const r = useReveal({ variant: "fade", duration: 400 });

  const stats = (Array.isArray(product?.stats) ? product.stats : [])
    .map((s: any) => ({
      label: String(s?.label || "").trim(),
      value: Math.max(0, Math.min(100, Math.round(Number(s?.value) || 0))),
    }))
    .filter((s: any) => s.label)
    .slice(0, 6);

  if (stats.length === 0) return null;

  return (
    <div ref={r.ref} className="border border-line/12 bg-surface p-6">
      <h3 className="font-mono text-[10px] uppercase tracking-widest2 text-ink-muted">
        Perfil del producto
      </h3>

      <div className="mt-5 space-y-4">
        {stats.map((s: any, i: number) => (
          <div key={`${s.label}-${i}`}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[13px] font-medium text-ink-soft">{s.label}</span>
              <span className="tnum font-display text-base text-brand">{s.value}</span>
            </div>
            <div className="mt-2 h-[6px] overflow-hidden bg-fill/8">
              <div
                className="h-full origin-left bg-accent-400 transition-transform duration-[900ms] ease-out"
                style={{
                  width: `${s.value}%`,
                  // Escala en X en vez de animar `width`: transform puro, sin
                  // recalcular layout en cada cuadro.
                  transform: r.shown ? "scaleX(1)" : "scaleX(0)",
                  transitionDelay: `${i * 90}ms`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
