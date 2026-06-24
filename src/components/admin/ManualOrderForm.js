"use client";

import { useMemo, useState } from "react";
import { formatPrice } from "@/lib/format";

// Formulario para registrar un pedido MANUAL: ventas hechas antes o por fuera
// de la tienda. Descuenta stock igual que un pedido normal (vía el backend).
export default function ManualOrderForm({ products = [], onCreated, onCancel }) {
  const [qtys, setQtys] = useState({}); // id -> cantidad
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("confirmada");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [conflicts, setConflicts] = useState([]);

  const setQty = (id, q) => setQtys((m) => ({ ...m, [id]: Math.max(0, q) }));

  const items = useMemo(
    () =>
      products
        .filter((p) => (qtys[p.id] || 0) > 0)
        .map((p) => ({ ...p, quantity: qtys[p.id] })),
    [products, qtys]
  );
  const total = items.reduce((s, it) => s + it.price * it.quantity, 0);

  async function submit(e) {
    e.preventDefault();
    if (items.length === 0) {
      setError("Agregá al menos un producto.");
      return;
    }
    setSaving(true);
    setError(null);
    setConflicts([]);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manual: true,
          status,
          items: items.map((i) => ({ id: i.id, quantity: i.quantity })),
          customer: { name, note },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        onCreated?.(data.order);
      } else {
        setError(data.error || "No se pudo crear el pedido.");
        setConflicts(data.conflicts || []);
      }
    } catch {
      setError("Error de conexión.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="card p-5 shadow-soft">
      <h3 className="text-sm font-semibold text-ink">Cargar pedido manual</h3>
      <p className="mt-1 text-xs text-ink-muted">
        Registrá una venta hecha antes o por fuera de la tienda. Descuenta stock.
      </p>

      {products.length === 0 ? (
        <p className="mt-4 text-sm text-ink-muted">
          No hay productos cargados todavía.
        </p>
      ) : (
        <div className="no-scrollbar mt-4 max-h-64 space-y-1.5 overflow-y-auto">
          {products.map((p) => {
            const q = qtys[p.id] || 0;
            return (
              <div
                key={p.id}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition ${
                  q > 0 ? "border-accent-500/40 bg-accent-500/5" : "border-white/10"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-ink">{p.name}</div>
                  <div className="text-xs text-ink-muted">
                    {formatPrice(p.price)} · stock {p.stock}
                  </div>
                </div>
                <div className="flex items-center rounded-lg border border-white/15">
                  <button
                    type="button"
                    onClick={() => setQty(p.id, q - 1)}
                    className="flex h-8 w-8 items-center justify-center text-ink-soft hover:text-ink"
                    aria-label="Restar"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm">{q}</span>
                  <button
                    type="button"
                    onClick={() => setQty(p.id, q + 1)}
                    className="flex h-8 w-8 items-center justify-center text-ink-soft hover:text-ink"
                    aria-label="Sumar"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Cliente (opcional)</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del cliente"
          />
        </div>
        <div>
          <label className="label">Estado</label>
          <select
            className="input"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="confirmada">Confirmada</option>
            <option value="pendiente">Pendiente</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label">Nota (opcional)</label>
          <input
            className="input"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Detalle, dirección, etc."
          />
        </div>
      </div>

      {error && (
        <div className="mt-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-200">
          <p className="font-medium">{error}</p>
          {conflicts.length > 0 && (
            <ul className="mt-1 list-inside list-disc text-xs">
              {conflicts.map((c, i) => (
                <li key={i}>
                  {c.name ? `${c.name}: ` : ""}
                  {c.reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="text-sm text-ink-soft">
          Total:{" "}
          <span className="font-semibold text-ink">{formatPrice(total)}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="btn-ghost px-4 py-2 text-[13px]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || items.length === 0}
            className="btn-accent px-5 py-2 text-[13px]"
          >
            {saving ? "Guardando…" : "Crear pedido"}
          </button>
        </div>
      </div>
    </form>
  );
}
