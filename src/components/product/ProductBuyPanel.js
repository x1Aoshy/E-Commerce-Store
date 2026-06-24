"use client";

import { useState } from "react";
import StockBadge, { stockStatus } from "@/components/StockBadge";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/format";

export default function ProductBuyPanel({ product }) {
  const { addItem, openCart } = useCart();
  const s = stockStatus(product.stock);
  const max = Math.max(1, Number(product.stock) || 1);
  const [qty, setQty] = useState(1);

  const addToCart = () => {
    addItem(product, qty);
    openCart();
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="chip bg-white/5 text-ink-soft ring-1 ring-white/10">
          {product.category}
        </span>
        <StockBadge stock={product.stock} />
      </div>

      <div className="mt-4 text-3xl font-semibold text-ink">
        {formatPrice(product.price)}
      </div>

      {s.available ? (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-full border border-white/15">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="flex h-11 w-11 items-center justify-center text-lg text-ink-soft transition hover:text-ink active:scale-90"
              aria-label="Restar"
            >
              −
            </button>
            <span className="w-8 text-center text-sm font-medium">{qty}</span>
            <button
              onClick={() => setQty((q) => Math.min(max, q + 1))}
              className="flex h-11 w-11 items-center justify-center text-lg text-ink-soft transition hover:text-ink active:scale-90"
              aria-label="Sumar"
            >
              +
            </button>
          </div>
          <button onClick={addToCart} className="btn-accent flex-1 py-3.5">
            Agregar al carrito
          </button>
        </div>
      ) : (
        <div className="mt-6 rounded-xl bg-white/5 px-4 py-3 text-sm text-ink-soft">
          Producto sin stock por el momento. Escribinos por WhatsApp para
          avisarte cuando vuelva.
        </div>
      )}
    </div>
  );
}
