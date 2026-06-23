"use client";

import ProductImage from "./ProductImage";
import StockBadge, { stockStatus } from "./StockBadge";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/context/CartContext";

export default function ProductCard({ product, onView }) {
  const { addItem } = useCart();
  const s = stockStatus(product.stock);

  return (
    <article className="card group flex flex-col overflow-hidden shadow-soft transition hover:-translate-y-0.5 hover:shadow-card">
      <button
        onClick={() => onView(product)}
        className="relative block aspect-[4/3] w-full"
        aria-label={`Ver ${product.name}`}
      >
        <ProductImage product={product} className="h-full w-full" />
        <span className="chip absolute left-3 top-3 bg-white/85 text-ink-soft ring-1 ring-ink/10 backdrop-blur">
          {product.category}
        </span>
      </button>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-[15px] font-semibold leading-snug text-ink">
          <button onClick={() => onView(product)} className="text-left hover:text-accent-600">
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
            onClick={() => addItem(product)}
            className="btn-accent px-4 py-2 text-[13px]"
          >
            {s.available ? "Agregar" : "Agotado"}
          </button>
        </div>
      </div>
    </article>
  );
}
