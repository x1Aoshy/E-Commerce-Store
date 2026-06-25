"use client";

import { useState } from "react";
import { useToast } from "@/components/Toast";

export default function InventoryRow({ product, onUpdated, onDeleted, onRestock, onEditMedia }) {
  const toast = useToast();
  const [price, setPrice] = useState(String(product.price));
  const [compareAt, setCompareAt] = useState(String(product.compareAt || ""));
  const [stock, setStock] = useState(Number(product.stock));
  const [featured, setFeatured] = useState(Boolean(product.featured));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(null);

  const dirty =
    Number(price) !== Number(product.price) ||
    Number(compareAt || 0) !== Number(product.compareAt || 0) ||
    Number(stock) !== Number(product.stock) ||
    featured !== Boolean(product.featured);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price: Number(price) || 0,
          compareAt: Number(compareAt) || 0,
          stock: Math.max(0, Number(stock) || 0),
          featured,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        onUpdated(data.product);
        toast.success("Cambios guardados");
      } else {
        const msg = data.error || "No se pudo guardar.";
        setError(msg);
        toast.error(msg);
      }
    } catch {
      setError("Error de conexión.");
      toast.error("Error de conexión.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
      if (res.ok) {
        onDeleted?.(product.id);
        toast.success("Producto eliminado");
        return; // la fila se desmonta
      }
      const data = await res.json().catch(() => ({}));
      const msg = data.error || "No se pudo eliminar.";
      setError(msg);
      toast.error(msg);
    } catch {
      setError("Error de conexión.");
      toast.error("Error de conexión.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <tr className="border-b border-white/[0.06] last:border-0">
      <td className="px-4 py-3">
        <div className="font-medium text-ink">{product.name}</div>
        <div className="text-xs text-ink-muted">{product.short}</div>
        {error && <div className="mt-1 text-[11px] text-red-300">{error}</div>}
      </td>
      <td className="px-4 py-3 text-ink-soft">{product.category}</td>
      <td className="px-4 py-3">
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ""))}
          inputMode="numeric"
          placeholder="Precio"
          className="w-24 rounded-[4px] border border-white/15 bg-transparent px-2.5 py-1.5 text-sm text-ink outline-none focus:border-accent-400"
        />
        <input
          value={compareAt}
          onChange={(e) => setCompareAt(e.target.value.replace(/[^\d]/g, ""))}
          inputMode="numeric"
          placeholder="Antes (OFF)"
          title="Precio anterior tachado. Dejá vacío o 0 para no mostrar descuento."
          className="mt-1.5 w-24 rounded-[4px] border border-white/10 bg-transparent px-2.5 py-1 text-xs text-ink-muted outline-none focus:border-accent-400"
        />
      </td>
      <td className="px-4 py-3">
        <div className="inline-flex items-center rounded-[4px] border border-white/15">
          <button
            onClick={() => setStock((s) => Math.max(0, Number(s) - 1))}
            className="flex h-8 w-8 items-center justify-center text-ink-soft hover:text-ink"
            aria-label="Restar stock"
          >
            −
          </button>
          <input
            value={stock}
            onChange={(e) =>
              setStock(Math.max(0, Number(e.target.value.replace(/[^\d]/g, "")) || 0))
            }
            inputMode="numeric"
            className="w-12 border-x border-white/15 bg-transparent py-1.5 text-center text-sm text-ink outline-none"
          />
          <button
            onClick={() => setStock((s) => Number(s) + 1)}
            className="flex h-8 w-8 items-center justify-center text-ink-soft hover:text-ink"
            aria-label="Sumar stock"
          >
            +
          </button>
        </div>
      </td>
      <td className="px-4 py-3">
        <button
          onClick={() => setFeatured((f) => !f)}
          className={`flex h-8 w-8 items-center justify-center rounded-[4px] transition ${
            featured
              ? "bg-accent-500/15 text-accent-300 ring-1 ring-accent-500/30"
              : "text-ink-muted ring-1 ring-white/10 hover:ring-white/30"
          }`}
          aria-label="Destacar"
          title={featured ? "Destacado" : "No destacado"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={featured ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
            <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17.9 6.8 19.6l1-5.8L3.5 9.7l5.9-.9z" />
          </svg>
        </button>
      </td>
      <td className="px-4 py-3 text-right">
        {confirming ? (
          <span className="inline-flex items-center gap-2 whitespace-nowrap">
            <span className="text-xs text-ink-muted">¿Eliminar?</span>
            <button
              onClick={remove}
              disabled={deleting}
              className="rounded-[4px] bg-red-500/15 px-3 py-1.5 text-[12px] font-medium text-red-300 ring-1 ring-red-500/30 transition hover:bg-red-500/25 disabled:opacity-50"
            >
              {deleting ? "…" : "Sí, eliminar"}
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="px-1 text-[12px] text-ink-muted transition hover:text-ink"
            >
              No
            </button>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5">
            <button
              onClick={() => onEditMedia?.(product)}
              aria-label="Imágenes"
              title="Imágenes / video"
              className="relative flex h-8 w-8 items-center justify-center rounded-[4px] text-ink-muted ring-1 ring-white/10 transition hover:text-accent-300 hover:ring-accent-500/40"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <circle cx="8.5" cy="10" r="1.5" />
                <path d="M21 16l-5-5L5 19" />
              </svg>
              {Array.isArray(product.images) && product.images.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent-500 px-1 text-[9px] font-semibold text-night">
                  {product.images.length}
                </span>
              )}
            </button>
            <button
              onClick={() => onRestock?.(product)}
              aria-label="Restock"
              title="Sumar stock"
              className="flex h-8 w-8 items-center justify-center rounded-[4px] text-ink-muted ring-1 ring-white/10 transition hover:text-accent-300 hover:ring-accent-500/40"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v8M8 12h8" />
              </svg>
            </button>
            <button
              onClick={save}
              disabled={!dirty || saving}
              className="btn-primary px-3.5 py-1.5 text-[12px]"
            >
              {saving ? "…" : "Guardar"}
            </button>
            <button
              onClick={() => setConfirming(true)}
              aria-label="Eliminar producto"
              title="Eliminar producto"
              className="flex h-8 w-8 items-center justify-center rounded-[4px] text-ink-muted ring-1 ring-white/10 transition hover:text-red-300 hover:ring-red-500/40"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
              </svg>
            </button>
          </span>
        )}
      </td>
    </tr>
  );
}
