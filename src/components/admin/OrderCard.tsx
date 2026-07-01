"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/format";
import { printInvoice } from "@/lib/invoice";
import Modal from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { useBranding } from "@/context/BrandingContext";

const STORE = process.env.NEXT_PUBLIC_STORE_NAME || "Titan Supplements";
const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY || "C$";
const PHONE = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/[^\d]/g, "");

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString("es-NI", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function StatusChip({ status }: any) {
  if (status === "confirmada") {
    return (
      <span className="chip bg-green-500/15 text-green-300 ring-1 ring-green-500/30">
        Completada
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

function PaymentChip({ method }: any) {
  if (method === "efectivo")
    return (
      <span className="chip bg-green-500/15 text-green-300 ring-1 ring-green-500/30">
        Efectivo
      </span>
    );
  if (method === "transferencia")
    return (
      <span className="chip bg-accent-500/15 text-accent-300 ring-1 ring-accent-500/30">
        Transferencia
      </span>
    );
  return null;
}

// Pedido despachado / en camino. Sólo informativo (no toca stock) y no se
// muestra en pedidos cancelados.
function ShippedChip({ shipped, cancelled }: any) {
  if (!shipped || cancelled) return null;
  return (
    <span className="chip bg-accent-500/15 text-accent-300 ring-1 ring-accent-500/30">
      🚚 En camino
    </span>
  );
}

function PaidChip({ paid, confirmed }: any) {
  if (paid)
    return (
      <span className="chip bg-green-500/15 text-green-300 ring-1 ring-green-500/30">
        Cobrada
      </span>
    );
  if (confirmed)
    return (
      <span className="chip bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/30">
        Sin cobrar
      </span>
    );
  return null;
}

function PaymentForm({ order, onSave, saving, sellers = [] }: any) {
  const [method, setMethod] = useState(order.paymentMethod || "efectivo");
  const [extra, setExtra] = useState(order.extra ? String(order.extra) : "");
  const [label, setLabel] = useState(order.extraLabel || "Delivery");
  const [seller, setSeller] = useState(order.seller || "");

  return (
    <div>
      <label className="label">Atendido por</label>
      <input
        className="input"
        value={seller}
        onChange={(e) => setSeller(e.target.value)}
        placeholder="Quién facturó"
        list="order-sellers-list"
      />
      <datalist id="order-sellers-list">
        {sellers.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      <label className="label mt-4">Método de pago</label>
      <div className="flex gap-2">
        {[
          ["efectivo", "Efectivo"],
          ["transferencia", "Transferencia"],
        ].map(([m, l]) => (
          <button
            key={m}
            type="button"
            onClick={() => setMethod(m)}
            className={`flex-1 rounded-[4px] border px-3 py-2.5 text-sm font-medium transition ${
              method === m
                ? "border-accent-500 bg-accent-500/10 text-accent-300"
                : "border-white/15 text-ink-soft hover:border-white/30"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div>
          <label className="label">Cargo extra</label>
          <input
            className="input"
            inputMode="numeric"
            value={extra}
            onChange={(e) => setExtra(e.target.value.replace(/[^\d]/g, ""))}
            placeholder="0"
          />
        </div>
        <div>
          <label className="label">Concepto</label>
          <input
            className="input"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Delivery"
          />
        </div>
      </div>

      <button
        onClick={() =>
          onSave({
            paymentMethod: method,
            extra: Number(extra) || 0,
            extraLabel: label,
            seller,
          })
        }
        disabled={saving}
        className="btn-accent mt-5 w-full py-3"
      >
        {saving ? "Guardando…" : "Guardar"}
      </button>
    </div>
  );
}

export default function OrderCard({ order, onUpdated, onDeleted, sellers = [] }) {
  const [saving, setSaving] = useState<any>(null);
  const [err, setErr] = useState<any>(null);
  const [showPay, setShowPay] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const toast = useToast();
  const { whatsappNumber, storeName, logoUrl, loginIconUrl } = useBranding();
  const phone = (whatsappNumber || "").replace(/[^\d]/g, "") || PHONE;
  const invoiceLogo = logoUrl || loginIconUrl;

  // Pre-genera el QR del recibo (data URL) para incrustarlo en la factura. Se
  // arma acá para que el botón de imprimir abra la ventana de inmediato (sin
  // await, que dispararía el bloqueador de pop-ups).
  useEffect(() => {
    if (!order.token || typeof window === "undefined") return;
    let active = true;
    const url = `${window.location.origin}/recibo/${order.token}`;
    import("qrcode")
      .then((m) =>
        m.default.toDataURL(url, {
          width: 320,
          margin: 1,
          color: { dark: "#16181a", light: "#ffffff" },
          errorCorrectionLevel: "M",
        })
      )
      .then((dataUrl) => active && setQrDataUrl(dataUrl))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [order.token]);

  const confirmed = order.status === "confirmada";
  const cancelled = order.status === "cancelada";
  const paid = !!order.paid;
  const extra = Number(order.extra) || 0;
  const grand = (Number(order.total) || 0) + extra;

  async function patch(body, action) {
    setSaving(action);
    setErr(null);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        onUpdated(data.order);
        return true;
      }
      const msg = data.error || "No se pudo actualizar el pedido.";
      setErr(msg);
      toast.error(msg);
      return false;
    } catch {
      setErr("Error de conexión.");
      toast.error("Error de conexión.");
      return false;
    } finally {
      setSaving(null);
    }
  }

  async function del() {
    setSaving("delete");
    setErr(null);
    try {
      const res = await fetch(`/api/orders/${order.id}`, { method: "DELETE" });
      if (res.ok) {
        onDeleted?.(order.id);
        toast.success("Pedido eliminado");
        return;
      }
      const data = await res.json().catch(() => ({}));
      const msg = data.error || "No se pudo eliminar la orden.";
      setErr(msg);
      toast.error(msg);
    } catch {
      setErr("Error de conexión.");
      toast.error("Error de conexión.");
    } finally {
      setSaving(null);
    }
  }

  const busy = saving !== null;

  return (
    <div className={`card p-4 shadow-soft ${cancelled ? "opacity-70" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-ink">{order.code}</span>
            <StatusChip status={order.status} />
            <PaidChip paid={paid} confirmed={confirmed} />
            <ShippedChip shipped={order.shipped} cancelled={cancelled} />
            <PaymentChip method={order.paymentMethod} />
          </div>
          <div className="mt-0.5 text-xs text-ink-muted">
            {formatDate(order.createdAt)}
            {order.customer?.name ? ` · ${order.customer.name}` : ""}
            {order.customer?.phone ? ` · ${order.customer.phone}` : ""}
          </div>
          {order.seller && (
            <div className="mt-0.5 text-xs text-ink-muted">
              Atendido por <span className="text-ink-soft">{order.seller}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div
            className={`text-base font-semibold ${
              cancelled ? "text-ink-muted" : "text-ink"
            }`}
          >
            {formatPrice(grand)}
          </div>
          <button
            onClick={() =>
              printInvoice({
                order,
                storeName: storeName || STORE,
                currency: CURRENCY,
                phone,
                logoUrl: invoiceLogo,
                qrDataUrl,
              })
            }
            className="inline-flex items-center gap-1 rounded-[4px] px-2 py-1 text-[11px] font-medium text-ink-muted ring-1 ring-white/10 transition hover:text-ink hover:ring-white/30"
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
          {order.token && (
            <a
              href={`/recibo/${order.token}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-[4px] px-2 py-1 text-[11px] font-medium text-ink-muted ring-1 ring-white/10 transition hover:text-ink hover:ring-white/30"
              title="Ver recibo del cliente (QR)"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <path d="M14 14h3v3M21 14v4M17 21h4" />
              </svg>
              Recibo
            </a>
          )}
        </div>
      </div>

      <ul className="mt-3 space-y-1 border-t border-white/10 pt-3 text-sm text-ink-soft">
        {order.items.map((it) => (
          <li key={it.id} className="flex justify-between gap-3">
            <span>
              {it.quantity}× {it.name || "Producto"}
            </span>
            <span className="text-ink-muted">{formatPrice(it.subtotal)}</span>
          </li>
        ))}
        {extra > 0 && (
          <li className="flex justify-between gap-3 text-ink-muted">
            <span>{order.extraLabel || "Cargo extra"}</span>
            <span>{formatPrice(extra)}</span>
          </li>
        )}
      </ul>

      {order.customer?.note && (
        <p className="mt-3 rounded-[4px] bg-white/5 px-3 py-2 text-xs text-ink-soft">
          {order.customer.note}
        </p>
      )}

      {err && <p className="mt-3 text-xs text-red-300">{err}</p>}

      {confirmDel ? (
        <div className="mt-3 flex items-center justify-between gap-2 rounded-[4px] border border-red-500/30 bg-red-500/5 px-3 py-2">
          <span className="text-xs text-ink-soft">
            ¿Eliminar del sistema? Devuelve stock si no estaba cancelada.
          </span>
          <span className="flex shrink-0 items-center gap-2">
            <button
              onClick={del}
              disabled={busy}
              className="rounded-[4px] bg-red-500/15 px-3 py-1.5 text-[12px] font-medium text-red-300 ring-1 ring-red-500/30 transition hover:bg-red-500/25 disabled:opacity-50"
            >
              {saving === "delete" ? "…" : "Sí, eliminar"}
            </button>
            <button
              onClick={() => setConfirmDel(false)}
              className="px-1 text-[12px] text-ink-muted transition hover:text-ink"
            >
              No
            </button>
          </span>
        </div>
      ) : cancelled ? (
        <div className="mt-3 flex items-stretch gap-2">
          <button
            onClick={async () => {
              const ok = await patch({ status: "pendiente" }, "reactivate");
              if (ok) toast.success("Pedido reactivado");
            }}
            disabled={busy}
            className="flex-1 rounded-[4px] border border-white/15 py-2 text-[13px] font-medium text-ink-soft transition hover:border-white/35 disabled:pointer-events-none disabled:opacity-40"
          >
            {saving === "reactivate" ? "…" : "Reactivar pedido"}
          </button>
          <button
            onClick={() => setConfirmDel(true)}
            disabled={busy}
            className="rounded-[4px] border border-red-500/30 px-4 py-2 text-[13px] font-medium text-red-400 transition hover:border-red-500/50 hover:bg-red-500/10 disabled:opacity-40"
          >
            Eliminar
          </button>
        </div>
      ) : (
        <>
          {/* Completada + Cobrada: el stock se descuenta SÓLO cuando ambas están
              activas. */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={async () => {
                const toCompleted = !confirmed;
                const ok = await patch(
                  { status: toCompleted ? "confirmada" : "pendiente" },
                  "toggle"
                );
                if (ok) toast.success(toCompleted ? "Completada" : "Pendiente");
              }}
              disabled={busy}
              className={`rounded-[4px] py-2 text-[13px] font-medium transition disabled:pointer-events-none disabled:opacity-40 ${
                confirmed
                  ? "border border-green-500/40 bg-green-500/10 text-green-300"
                  : "bg-accent-500 text-night hover:bg-accent-400"
              }`}
            >
              {saving === "toggle" ? "…" : confirmed ? "✓ Completada" : "Completar"}
            </button>
            <button
              onClick={async () => {
                const ok = await patch({ paid: !paid }, "paid");
                if (ok) toast.success(paid ? "Marcada sin cobrar" : "Cobrada");
              }}
              disabled={busy}
              className={`rounded-[4px] py-2 text-[13px] font-medium transition disabled:pointer-events-none disabled:opacity-40 ${
                paid
                  ? "border border-green-500/40 bg-green-500/10 text-green-300"
                  : "border border-white/15 text-ink-soft hover:border-white/35"
              }`}
            >
              {saving === "paid" ? "…" : paid ? "✓ Cobrada" : "Marcar cobrada"}
            </button>
          </div>
          <p className="mt-1.5 text-[11px] text-ink-muted">
            {confirmed && paid
              ? "Stock descontado (completada y cobrada)."
              : confirmed
              ? "Marcá «Cobrada» para descontar el stock."
              : paid
              ? "Marcá «Completada» para descontar el stock."
              : "El stock se descuenta al estar completada y cobrada."}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              onClick={() => setShowPay(true)}
              disabled={busy}
              className="rounded-[4px] border border-white/15 py-2 text-[13px] font-medium text-ink-soft transition hover:border-white/35 disabled:opacity-40"
            >
              Pago / Extra
            </button>
            {/* "En camino" NO toca stock: es sólo un aviso para el cliente
                (se refleja en su recibo por QR). */}
            <button
              onClick={async () => {
                const toShipped = !order.shipped;
                const ok = await patch({ shipped: toShipped }, "ship");
                if (ok)
                  toast.success(
                    toShipped ? "Marcado en camino" : "Ya no está en camino"
                  );
              }}
              disabled={busy}
              className={`rounded-[4px] py-2 text-[13px] font-medium transition disabled:pointer-events-none disabled:opacity-40 ${
                order.shipped
                  ? "border border-accent-500/40 bg-accent-500/10 text-accent-300"
                  : "border border-white/15 text-ink-soft hover:border-white/35"
              }`}
            >
              {saving === "ship" ? "…" : order.shipped ? "🚚 En camino" : "Marcar en camino"}
            </button>
          </div>
          <div className="mt-2 flex items-stretch justify-end gap-2">
            <button
              onClick={async () => {
                const ok = await patch({ status: "cancelada" }, "cancel");
                if (ok) toast.info("Pedido cancelado");
              }}
              disabled={busy}
              title="Cancela el pedido y libera el stock reservado"
              className="rounded-[4px] border border-amber-400/30 px-4 py-2 text-[13px] font-medium text-amber-300 transition hover:border-amber-400/50 hover:bg-amber-400/10 disabled:opacity-40"
            >
              {saving === "cancel" ? "…" : "Cancelar"}
            </button>
            <button
              onClick={() => setConfirmDel(true)}
              disabled={busy}
              aria-label="Eliminar pedido"
              className="rounded-[4px] border border-red-500/30 px-4 py-2 text-[13px] font-medium text-red-400 transition hover:border-red-500/50 hover:bg-red-500/10 disabled:opacity-40"
            >
              Eliminar
            </button>
          </div>
        </>
      )}

      <Modal open={showPay} onClose={() => setShowPay(false)} title="Pago y cargo extra" maxW="max-w-md">
        <PaymentForm
          order={order}
          sellers={sellers}
          saving={saving === "pay"}
          onSave={async (body) => {
            const ok = await patch(body, "pay");
            if (ok) {
              toast.success("Pago guardado");
              setShowPay(false);
            }
          }}
        />
      </Modal>
    </div>
  );
}
