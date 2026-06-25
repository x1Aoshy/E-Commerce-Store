"use client";

import { useState } from "react";
import Link from "next/link";
import ProductImage from "./ProductImage";
import StockBadge, { stockStatus } from "./StockBadge";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/context/CartContext";

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const s = stockStatus(product.stock);
  const [added, setAdded] = useState(false);
  const href = `/producto/${product.slug}`;
  const onSale = Number(product.compareAt) > Number(product.price);
  const off = onSale ? Math.round((1 - product.price / product.compareAt) * 100) : 0;

  const handleAdd = () => {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <article className="card group flex h-full flex-col overflow-hidden shadow-soft transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-card">
      <Link
        href={href}
        className="relative block aspect-[4/3] w-full overflow-hidden"
        aria-label={`Ver ${product.name}`}
      >
        <ProductImage
          product={product}
          className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-105"
        />
        {onSale && (
          <span className="absolute right-3 top-3 rounded-[3px] bg-accent-500 px-2 py-0.5 text-[11px] font-bold text-night">
            -{off}% OFF
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="truncate text-[11px] font-medium uppercase tracking-wide text-ink-muted">
            {product.category}
          </span>
          <StockBadge stock={product.stock} />
        </div>
        <h3 className="text-[15px] font-semibold leading-snug text-ink">
          <Link href={href} className="transition-colors hover:text-accent-300">
            {product.name}
          </Link>
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{product.short}</p>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
          <div className="flex flex-col leading-tight">
            {onSale && (
              <span className="text-xs text-ink-muted line-through">
                {formatPrice(product.compareAt)}
              </span>
            )}
            <span className="text-lg font-semibold text-ink">
              {formatPrice(product.price)}
            </span>
          </div>
          <button
            disabled={!s.available}
            onClick={handleAdd}
            aria-live="polite"
            className={`btn-accent min-w-[104px] px-4 py-2 text-[13px] ${
              added ? "!bg-accent-400" : ""
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
