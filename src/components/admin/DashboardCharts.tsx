"use client";

// Gráficas hechas a mano con SVG, sin librerías externas.
// - Dona: distribución de pedidos por estado (pendiente / confirmada / cancelada).
// - Barras: unidades de stock por categoría.
// Reciben products y orders y derivan las métricas con useMemo.

import { useMemo } from "react";
import { useCurrency } from "@/context/CurrencyContext";

// Paleta consistente con el tema oscuro (accent vibrante + amber + gris).
const STATUS_META = {
  pendiente: { label: "Pendientes", color: "#fbbf24" }, // amber-400
  confirmada: { label: "Confirmadas", color: "#3fae7a" }, // verde (confirmado)
  cancelada: { label: "Canceladas", color: "#6b7378" }, // gris atenuado
};

// Tonos de accent para las barras de categorías (se ciclan si hay muchas).
const BAR_COLORS = ["#d4a82f", "#e7c454", "#c99a2b", "#a87e22", "#efd886", "#86631d"];

// Construye el atributo `d` de un segmento de dona (arco entre dos ángulos).
function donutSegment(cx, cy, rOuter, rInner, startAngle, endAngle) {
  const large = endAngle - startAngle > Math.PI ? 1 : 0;
  const p = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const [x1, y1] = p(rOuter, startAngle);
  const [x2, y2] = p(rOuter, endAngle);
  const [x3, y3] = p(rInner, endAngle);
  const [x4, y4] = p(rInner, startAngle);
  return [
    `M ${x1} ${y1}`,
    `A ${rOuter} ${rOuter} 0 ${large} 1 ${x2} ${y2}`,
    `L ${x3} ${y3}`,
    `A ${rInner} ${rInner} 0 ${large} 0 ${x4} ${y4}`,
    "Z",
  ].join(" ");
}

function DonutChart({ data, total }: any) {
  const size = 168;
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = 76;
  const rInner = 50;
  const start = -Math.PI / 2; // arranca arriba

  let acc = start;
  const segments = data.map((d) => {
    const frac = total > 0 ? d.value / total : 0;
    const startAngle = acc;
    const endAngle = acc + frac * Math.PI * 2;
    acc = endAngle;
    return { ...d, frac, startAngle, endAngle };
  });

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="Distribución de pedidos por estado"
        className="shrink-0"
      >
        {total === 0 ? (
          <circle
            cx={cx}
            cy={cy}
            r={(rOuter + rInner) / 2}
            fill="none"
            stroke="#23282b"
            strokeWidth={rOuter - rInner}
          />
        ) : (
          segments.map((s) =>
            // Si un único estado es el 100%, dibujamos un anillo completo
            // (un arco de 360° no se renderiza bien con un solo path).
            s.frac >= 0.9999 ? (
              <circle
                key={s.key}
                cx={cx}
                cy={cy}
                r={(rOuter + rInner) / 2}
                fill="none"
                stroke={s.color}
                strokeWidth={rOuter - rInner}
              />
            ) : s.frac > 0 ? (
              <path
                key={s.key}
                d={donutSegment(cx, cy, rOuter, rInner, s.startAngle, s.endAngle)}
                fill={s.color}
              />
            ) : null
          )
        )}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          className="fill-ink text-2xl font-semibold"
          style={{ fontSize: 26 }}
        >
          {total}
        </text>
        <text
          x={cx}
          y={cy + 16}
          textAnchor="middle"
          className="fill-ink-muted"
          style={{ fontSize: 11 }}
        >
          pedidos
        </text>
      </svg>

      <ul className="w-full space-y-2">
        {data.map((d) => (
          <li key={d.key} className="flex items-center gap-2.5 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-ink-soft">{d.label}</span>
            <span className="ml-auto font-medium text-ink">{d.value}</span>
            <span className="w-10 text-right text-xs text-ink-muted">
              {total > 0 ? Math.round((d.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BarChart({ data, formatValue }: any) {
  const max = data.reduce((m, d) => Math.max(m, d.value), 0);
  const niceMax = max > 0 ? max : 1;

  return (
    <div className="space-y-3">
      {data.length === 0 ? (
        <p className="text-sm text-ink-muted">Sin datos para mostrar.</p>
      ) : (
        data.map((d, i) => {
          const pct = Math.round((d.value / niceMax) * 100);
          const color = BAR_COLORS[i % BAR_COLORS.length];
          return (
            <div key={d.key}>
              <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate text-ink-soft">{d.label}</span>
                <span className="shrink-0 font-medium text-ink">
                  {formatValue ? formatValue(d.value) : d.value}
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function ChartCard({ title, subtitle, children }: any) {
  return (
    <div className="card p-5 shadow-soft">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-ink-muted">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export default function DashboardCharts({ products = [], orders = [] }) {
  const { formatPrice } = useCurrency();
  // Dona: pedidos por estado.
  const { statusData, totalOrders } = useMemo(() => {
    const counts: any = { pendiente: 0, confirmada: 0, cancelada: 0 };
    orders.forEach((o) => {
      if (counts[o.status] === undefined) counts[o.status] = 0;
      counts[o.status] += 1;
    });
    const statusData = Object.keys(STATUS_META).map((key) => ({
      key,
      label: STATUS_META[key].label,
      color: STATUS_META[key].color,
      value: counts[key] || 0,
    }));
    return { statusData, totalOrders: orders.length };
  }, [orders]);

  // Barras: unidades de stock por categoría (ordenadas desc, top 6).
  const stockByCategory = useMemo(() => {
    const map = new Map();
    products.forEach((p) => {
      const cat = p.category || "General";
      map.set(cat, (map.get(cat) || 0) + (Number(p.stock) || 0));
    });
    return Array.from(map.entries())
      .map(([cat, value]) => ({ key: cat, label: cat, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [products]);

  // Barras alternativas: valor de inventario por categoría (top 6).
  const valueByCategory = useMemo(() => {
    const map = new Map();
    products.forEach((p) => {
      const cat = p.category || "General";
      const val = (Number(p.price) || 0) * (Number(p.stock) || 0);
      map.set(cat, (map.get(cat) || 0) + val);
    });
    return Array.from(map.entries())
      .map(([cat, value]) => ({ key: cat, label: cat, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [products]);

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <ChartCard title="Pedidos por estado" subtitle="Distribución del total de órdenes">
        <DonutChart data={statusData} total={totalOrders} />
      </ChartCard>

      <ChartCard
        title="Unidades por categoría"
        subtitle="Stock disponible agrupado por categoría"
      >
        <BarChart data={stockByCategory} />
      </ChartCard>

      <ChartCard
        title="Valor de inventario por categoría"
        subtitle="Precio × stock, las 6 categorías más valiosas"
      >
        <BarChart data={valueByCategory} formatValue={formatPrice} />
      </ChartCard>

      <ChartCard
        title="Resumen de órdenes"
        subtitle="Ingresos potenciales según estado"
      >
        <OrdersSummary orders={orders} />
      </ChartCard>
    </div>
  );
}

// Mini panel de texto que acompaña a las gráficas: ingresos confirmados vs.
// pendientes vs. perdidos por cancelación.
function OrdersSummary({ orders }: any) {
  const { formatPrice } = useCurrency();
  const sums = useMemo(() => {
    const acc = { pendiente: 0, confirmada: 0, cancelada: 0 };
    orders.forEach((o) => {
      const t = Number(o.total) || 0;
      if (acc[o.status] === undefined) acc[o.status] = 0;
      acc[o.status] += t;
    });
    return acc;
  }, [orders]);

  const rows = [
    { label: "Confirmado", value: sums.confirmada, tone: "text-accent-300" },
    { label: "Pendiente", value: sums.pendiente, tone: "text-amber-300" },
    { label: "Cancelado", value: sums.cancelada, tone: "text-ink-muted" },
  ];

  return (
    <ul className="divide-y divide-white/[0.07]">
      {rows.map((r) => (
        <li key={r.label} className="flex items-center justify-between py-2.5">
          <span className="text-sm text-ink-soft">{r.label}</span>
          <span className={`text-sm font-semibold ${r.tone}`}>
            {formatPrice(r.value)}
          </span>
        </li>
      ))}
    </ul>
  );
}
