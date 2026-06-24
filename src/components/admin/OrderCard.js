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

// Chip de estado según la orden.
function StatusChip({ status }) {
  if (status === "confirmada") {
    return (
      <span className="chip bg-accent-50 text-accent-700 ring-1 ring-accent-200">
        Confirmada
      </span>
    );
  }
  if (status === "cancelada") {
    return (
      <span className="chip bg-ink/5 text-ink-muted ring-1 ring-ink/10">
        Cancelada
      </span>
    );
  }
  return (
    <span className="chip bg-amber-50 text-amber-700 ring-1 ring-amber-200">
      Pendiente
    </span>
  );
}

export default function OrderCard({ order, onUpdated }) {
  // saving guarda qué acción está en curso para deshabilitar sólo lo justo.
  const [saving, setSaving] = useState(null); // null | 'toggle' | 'cancel' | 'reactivate'
  const confirmed = order.status === "confirmada";
  const cancelled = order.status === "cancelada";

  // Cambia el estado de la orden vía PATCH y propaga la orden actualizada.
  // El backend se encarga de devolver/reservar stock al cancelar/reactivar.
  async function setStatus(next, action) {
    setSaving(action);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json();
      if (res.ok) onUpdated(data.order);
    } finally {
      setSaving(null);
    }
  }

  const toggle = () =>
    setStatus(confirmed ? "pendiente" : "confirmada", "toggle");
  const cancel = () => setStatus("cancelada", "cancel");
  const reactivate = () => setStatus("pendiente", "reactivate");

  return (
    <div
      className={`card p-4 shadow-soft transition ${
        cancelled ? "opacity-70" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-ink">{order.code}</span>
            <StatusChip status={order.status} />
          </div>
          <div className="mt-0.5 text-xs text-ink-muted">
            {formatDate(order.createdAt)}
            {order.customer?.name ? ` · ${order.customer.name}` : ""}
          </div>
        </div>
        <div className="text-right">
          <div
            className={`text-base font-semibold ${
              cancelled ? "text-ink-muted line-through" : "text-ink"
            }`}
          >
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

      {cancelled ? (
        // Orden cancelada: el stock ya se liberó. Sólo se puede reactivar
        // (vuelve a pendiente y el backend reserva stock de nuevo).
        <button
          onClick={reactivate}
          disabled={saving !== null}
          className="mt-3 w-full rounded-full border border-ink/15 py-2 text-[13px] font-medium text-ink-soft transition hover:border-ink/40 disabled:pointer-events-none disabled:opacity-40"
        >
          {saving === "reactivate" ? "…" : "Reactivar pedido"}
        </button>
      ) : (
        <div className="mt-3 flex items-stretch gap-2">
          <button
            onClick={toggle}
            disabled={saving !== null}
            className={`flex-1 rounded-full py-2 text-[13px] font-medium transition disabled:pointer-events-none disabled:opacity-40 ${
              confirmed
                ? "border border-ink/15 text-ink-soft hover:border-ink/40"
                : "bg-accent-500 text-white hover:bg-accent-600"
            }`}
          >
            {saving === "toggle"
              ? "…"
              : confirmed
              ? "Marcar como pendiente"
              : "Marcar como confirmada"}
          </button>
          <button
            onClick={cancel}
            disabled={saving !== null}
            aria-label="Cancelar pedido y liberar stock"
            title="Cancela el pedido y libera el stock reservado"
            className="rounded-full border border-red-200 px-4 py-2 text-[13px] font-medium text-red-600 transition hover:border-red-400 hover:bg-red-50 disabled:pointer-events-none disabled:opacity-40"
          >
            {saving === "cancel" ? "…" : "Cancelar"}
          </button>
        </div>
      )}
    </div>
  );
}
