export function stockStatus(stock) {
  const n = Number(stock) || 0;
  if (n <= 0) return { label: "Agotado", tone: "out", available: false };
  if (n <= 5) return { label: `Últimas ${n} u.`, tone: "low", available: true };
  return { label: "En stock", tone: "in", available: true };
}

const TONES = {
  in: "bg-accent-500/15 text-accent-300 ring-1 ring-accent-500/30",
  low: "bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/30",
  out: "bg-white/5 text-ink-muted ring-1 ring-white/10",
};

export default function StockBadge({ stock }) {
  const s = stockStatus(stock);
  return <span className={`chip ${TONES[s.tone]}`}>{s.label}</span>;
}
