export function stockStatus(stock) {
  const n = Number(stock) || 0;
  if (n <= 0) return { label: "Agotado", tone: "out", available: false };
  if (n <= 5) return { label: `Últimas ${n} u.`, tone: "low", available: true };
  return { label: "En stock", tone: "in", available: true };
}

const DOT = {
  in: "bg-green-400",
  low: "bg-amber-400",
  out: "bg-ink-muted",
};
const TEXT = {
  in: "text-green-300",
  low: "text-amber-300",
  out: "text-ink-muted",
};

// Indicador de stock liviano: un punto de color + texto, sin píldora, para no
// saturar de badges las tarjetas de producto.
export default function StockBadge({ stock }) {
  const s = stockStatus(stock);
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${TEXT[s.tone]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[s.tone]}`} aria-hidden="true" />
      {s.label}
    </span>
  );
}
