export function stockStatus(stock) {
  const n = Number(stock) || 0;
  if (n <= 0) return { label: "Agotado", tone: "out", available: false };
  if (n <= 5) return { label: `Quedan ${n}`, tone: "low", available: true };
  return { label: "En stock", tone: "in", available: true };
}

// Verde = adelante · brasa = se acaba · apagado = no hay. El punto era
// parpadeante; se quitó porque en una rejilla de 20 productos son 20
// animaciones infinitas compitiendo, y el color solo ya comunica lo mismo.
const DOT = {
  in: "bg-green-400",
  low: "bg-ember-400",
  out: "bg-ink-muted",
};
const TEXT = {
  in: "text-green-300",
  low: "text-ember-300",
  out: "text-ink-muted",
};

// Indicador de stock liviano: punto de color + texto en mono, sin píldora, para
// no saturar de insignias las fichas.
export default function StockBadge({ stock }) {
  const s = stockStatus(stock);
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest2 ${TEXT[s.tone]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[s.tone]}`} aria-hidden="true" />
      {s.label}
    </span>
  );
}
