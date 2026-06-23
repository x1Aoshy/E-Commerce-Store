"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/format";

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString("es-AR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function OrderCard({ order, onUpdated }) {
  const [saving, setSaving] = useState(false);
  const confirmed = order.status === "confirmada";

  async function toggle() {
    setSaving(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: confirmed ? "pendiente" : "confirmada",
        }),
      });
      const data = await res.json();
      if (res.ok) onUpdated(data.order);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-ink">{order.code}</span>
            <span
              className={`chip ${
                confirmed
                  ? "bg-accent-50 text-accent-700 ring-1 ring-accent-200"
                  : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
              }`}
            >
              {confirmed ? "Confirmada" : "Pendiente"}
            </span>
          </div>
          <div className="mt-0.5 text-xs text-ink-muted">
            {formatDate(order.createdAt)}
            {order.customer?.name ? ` · ${order.customer.name}` : ""}
          </div>
        </div>
        <div className="text-right">
          <div className="text-base font-semibold text-ink">
            {formatPrice(order.total)}
          </div>
        </div>
      </div>

      <ul className="mt-3 space-y-1 border-t border-ink/[0.06] pt-3 text-sm text-ink-soft">
        {order.items.map((it) => (
          <li key={it.id} className="flex justify-between gap-3">
            <span>
              {it.quantity}× {it.name}
            </span>
            <span className="text-ink-muted">{formatPrice(it.subtotal)}</span>
          </li>
        ))}
      </ul>

      {order.customer?.note && (
        <p className="mt-3 rounded-lg bg-ink/[0.03] px-3 py-2 text-xs text-ink-soft">
          {order.customer.note}
        </p>
      )}

      <button
        onClick={toggle}
        disabled={saving}
        className={`mt-3 w-full rounded-full py-2 text-[13px] font-medium transition ${
          confirmed
            ? "border border-ink/15 text-ink-soft hover:border-ink/40"
            : "bg-accent-500 text-white hover:bg-accent-600"
        }`}
      >
        {saving
          ? "…"
          : confirmed
          ? "Marcar como pendiente"
          : "Marcar como confirmada"}
      </button>
    </div>
  );
}
