"use client";

import { useState } from "react";
import Link from "next/link";
import ProductGallery from "./ProductGallery";
import StockBadge, { stockStatus } from "./StockBadge";
import FavoriteButton from "./FavoriteButton";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/context/CartContext";

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const s = stockStatus(product.stock);
  const [added, setAdded] = useState(false);
  const href = `/producto/${product.slug}`;
  const onSale = Number(product.compareAt) > Number(product.price);
  const off = onSale ? Math.round((1 - product.price / product.compareAt) * 100) : 0;
  // Urgencia honesta: solo cuando de verdad quedan pocas unidades.
  const lowStock = s.available && Number(product.stock) > 0 && Number(product.stock) <= 5;

  const handleAdd = () => {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <article className="card group flex h-full flex-col overflow-hidden shadow-soft transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-card">
      <div className="relative aspect-[5/4] w-full overflow-hidden">
        <ProductGallery
          product={product}
          href={href}
          className="transition-transform duration-500 ease-out group-hover:scale-105"
        />
        <FavoriteButton id={product.id} variant="overlay" />
        {onSale && (
          <span className="absolute left-2 top-2 z-10 rounded-[3px] bg-accent-500 px-1.5 py-0.5 text-[10px] font-bold text-night shadow-soft">
            -{off}%
          </span>
        )}
        {lowStock && (
          <span className="absolute bottom-2 left-2 z-10 rounded-[3px] bg-night/70 px-1.5 py-0.5 text-[10px] font-semibold text-accent-200 ring-1 ring-white/10 backdrop-blur-sm">
            ¡Últimas {product.stock}!
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="truncate text-[10px] font-medium uppercase tracking-wide text-ink-muted">
            {product.category}
          </span>
          <StockBadge stock={product.stock} />
        </div>
        {product.name && (
          <h3 className="text-[13px] font-semibold leading-snug text-ink">
            <Link href={href} className="transition-colors hover:text-accent-300">
              {product.name}
            </Link>
          </h3>
        )}
        {product.short && (
          <p className="mt-0.5 line-clamp-2 text-xs text-ink-muted">{product.short}</p>
        )}

        <div className="mt-3 flex flex-col gap-2 border-t border-white/10 pt-2.5">
          <div className="flex items-baseline gap-2 leading-tight">
            <span className="text-base font-semibold text-ink">
              {formatPrice(product.price)}
            </span>
            {onSale && (
              <span className="text-[11px] text-ink-muted line-through">
                {formatPrice(product.compareAt)}
              </span>
            )}
          </div>
          <button
            disabled={!s.available}
            onClick={handleAdd}
            aria-live="polite"
            className={`btn-accent w-full px-3 py-2 text-xs ${added ? "!bg-accent-400" : ""}`}
          >
            {!s.available ? (
              "Agotado"
            ) : added ? (
              <>
                <svg
                  width="14"
                  height="14"
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
