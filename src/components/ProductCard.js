"use client";

import { useState } from "react";
import ProductImage from "./ProductImage";
import StockBadge, { stockStatus } from "./StockBadge";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/context/CartContext";

export default function ProductCard({ product, onView }) {
  const { addItem } = useCart();
  const s = stockStatus(product.stock);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <article className="card group flex h-full flex-col overflow-hidden shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-card">
      <button
        onClick={() => onView(product)}
        className="relative block aspect-[4/3] w-full overflow-hidden"
        aria-label={`Ver ${product.name}`}
      >
        <ProductImage
          product={product}
          className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-105"
        />
        <span className="chip absolute left-3 top-3 bg-white/85 text-ink-soft ring-1 ring-ink/10 backdrop-blur">
          {product.category}
        </span>
      </button>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-[15px] font-semibold leading-snug text-ink">
          <button
            onClick={() => onView(product)}
            className="text-left transition-colors hover:text-accent-600"
          >
            {product.name}
          </button>
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{product.short}</p>

        <div className="mt-3">
          <StockBadge stock={product.stock} />
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-ink/[0.06] pt-3">
          <span className="text-lg font-semibold text-ink">
            {formatPrice(product.price)}
          </span>
          <button
            disabled={!s.available}
            onClick={handleAdd}
            aria-live="polite"
            className={`btn-accent min-w-[104px] px-4 py-2 text-[13px] ${
              added ? "!bg-accent-600" : ""
            }`}
          >
            {!s.available ? (
              "Agotado"
            ) : added ? (
              <>
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12l5 5L20 6" />
                </svg>
                Agregado
              </>
            ) : (
              "Agregar"
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
