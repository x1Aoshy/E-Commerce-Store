"use client";

import { useState } from "react";

export default function InventoryRow({ product, onUpdated }) {
  const [price, setPrice] = useState(String(product.price));
  const [stock, setStock] = useState(Number(product.stock));
  const [featured, setFeatured] = useState(Boolean(product.featured));
  const [saving, setSaving] = useState(false);

  const dirty =
    Number(price) !== Number(product.price) ||
    Number(stock) !== Number(product.stock) ||
    featured !== Boolean(product.featured);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price: Number(price) || 0,
          stock: Math.max(0, Number(stock) || 0),
          featured,
        }),
      });
      const data = await res.json();
      if (res.ok) onUpdated(data.product);
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr className="border-b border-white/[0.06] last:border-0">
      <td className="px-4 py-3">
        <div className="font-medium text-ink">{product.name}</div>
        <div className="text-xs text-ink-muted">{product.short}</div>
      </td>
      <td className="px-4 py-3 text-ink-soft">{product.category}</td>
      <td className="px-4 py-3">
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ""))}
          inputMode="numeric"
          className="w-24 rounded-lg border border-white/15 bg-transparent px-2.5 py-1.5 text-sm text-ink outline-none focus:border-accent-400"
        />
      </td>
      <td className="px-4 py-3">
        <div className="inline-flex items-center rounded-lg border border-white/15">
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
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
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
        <button
          onClick={save}
          disabled={!dirty || saving}
          className="btn-primary px-3.5 py-1.5 text-[12px]"
        >
          {saving ? "…" : "Guardar"}
        </button>
      </td>
    </tr>
  );
}
