"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/format";
import { printInvoice } from "@/lib/invoice";

const STORE = process.env.NEXT_PUBLIC_STORE_NAME || "Titan Supplements";
const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY || "C$";
const PHONE = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/[^\d]/g, "");

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
      <span className="chip bg-accent-500/15 text-accent-300 ring-1 ring-accent-500/30">
        Confirmada
      </span>
    );
  }
  if (status === "cancelada") {
    return (
      <span className="chip bg-white/5 text-ink-muted ring-1 ring-white/10">
        Cancelada
      </span>
    );
  }
  return (
    <span className="chip bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/30">
      Pendiente
    </span>
  );
}

export default function OrderCard({ order, onUpdated }) {
  // saving guarda qué acción está en curso para deshabilitar sólo lo justo.
  const [saving, setSaving] = useState(null); // null | 'toggle' | 'cancel' | 'reactivate'
  const [err, setErr] = useState(null);
  const confirmed = order.status === "confirmada";
  const cancelled = order.status === "cancelada";

  // Cambia el estado de la orden vía PATCH y propaga la orden actualizada.
  // El backend se encarga de devolver/reservar stock al cancelar/reactivar.
  async function setStatus(next, action) {
    setSaving(action);
    setErr(null);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) onUpdated(data.order);
      else setErr(data.error || "No se pudo actualizar el pedido.");
    } catch {
      setErr("Error de conexión.");
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
        cancelled ? "opacity-60" : ""
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
        <div className="flex flex-col items-end gap-1.5">
          <div
            className={`text-base font-semibold ${
              cancelled ? "text-ink-muted line-through" : "text-ink"
            }`}
          >
            {formatPrice(order.total)}
          </div>
          <button
            onClick={() =>
              printInvoice({ order, storeName: STORE, currency: CURRENCY, phone: PHONE })
            }
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-ink-muted ring-1 ring-white/10 transition hover:text-ink hover:ring-white/30"
            aria-label="Imprimir factura"
            title="Imprimir factura"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9V3h12v6" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2" />
              <path d="M6 14h12v7H6z" />
            </svg>
            Factura
          </button>
        </div>
      </div>

      <ul className="mt-3 space-y-1 border-t border-white/10 pt-3 text-sm text-ink-soft">
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
        <p className="mt-3 rounded-lg bg-white/5 px-3 py-2 text-xs text-ink-soft">
          {order.customer.note}
        </p>
      )}

      {err && <p className="mt-3 text-xs text-red-300">{err}</p>}

      {cancelled ? (
        // Orden cancelada: el stock ya se liberó. Sólo se puede reactivar
        // (vuelve a pendiente y el backend reserva stock de nuevo).
        <button
          onClick={reactivate}
          disabled={saving !== null}
          className="mt-3 w-full rounded-full border border-white/15 py-2 text-[13px] font-medium text-ink-soft transition hover:border-white/35 disabled:pointer-events-none disabled:opacity-40"
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
                ? "border border-white/15 text-ink-soft hover:border-white/35"
                : "bg-accent-500 text-night hover:bg-accent-400"
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
            className="rounded-full border border-red-500/30 px-4 py-2 text-[13px] font-medium text-red-400 transition hover:border-red-500/50 hover:bg-red-500/10 disabled:pointer-events-none disabled:opacity-40"
          >
            {saving === "cancel" ? "…" : "Cancelar"}
          </button>
        </div>
      )}
    </div>
  );
}
