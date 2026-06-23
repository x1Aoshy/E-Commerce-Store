export function stockStatus(stock) {
  const n = Number(stock) || 0;
  if (n <= 0) return { label: "Agotado", tone: "out", available: false };
  if (n <= 5) return { label: `Últimas ${n} u.`, tone: "low", available: true };
  return { label: "En stock", tone: "in", available: true };
}

const TONES = {
  in: "bg-accent-50 text-accent-700 ring-1 ring-accent-200",
  low: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  out: "bg-ink/5 text-ink-muted ring-1 ring-ink/10",
};

export default function StockBadge({ stock }) {
  const s = stockStatus(stock);
  return <span className={`chip ${TONES[s.tone]}`}>{s.label}</span>;
}
