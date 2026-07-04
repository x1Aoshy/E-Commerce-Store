"use client";

import { memo, useState } from "react";
import Link from "next/link";
import ProductGallery from "./ProductGallery";
import { stockStatus } from "./StockBadge";
import FavoriteButton from "./FavoriteButton";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/context/CartContext";
import { useLang } from "@/context/LanguageContext";

// Estrellas compactas (rating promedio del producto).
function MiniStars({ rating = 5 }: any) {
  return (
    <span className="inline-flex gap-0.5 text-accent-400" aria-label={`${rating} de 5`}>
      {Array.from({ length: 5 }).map((_, s) => (
        <svg
          key={s}
          viewBox="0 0 24 24"
          className={`h-3 w-3 ${s < Math.round(rating) ? "" : "text-line/15"}`}
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="m12 2 3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01z" />
        </svg>
      ))}
    </span>
  );
}

// Tarjeta al estilo ecommerce clásico: la foto manda, y abajo solo lo que se
// necesita para decidir — nombre, estrellas, precio y agregar. La descripción
// y la reseña completa viven en la ficha del producto.
function ProductCard({ product }: any) {
  const { addItem } = useCart();
  const { t } = useLang();
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
    <article className="card group flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-0.5 hover:shadow-card">
      <div className="relative aspect-square w-full overflow-hidden bg-surface-soft">
        <ProductGallery
          product={product}
          href={href}
          className={`transition-transform duration-500 ease-out group-hover:scale-[1.04] ${
            s.available ? "" : "opacity-60 grayscale"
          }`}
        />
        <FavoriteButton id={product.id} variant="overlay" />
        {onSale && (
          <span className="absolute left-2 top-2 z-10 rounded-[3px] bg-accent-500 px-1.5 py-0.5 text-[10px] font-bold text-[#1a1306]">
            -{off}%
          </span>
        )}
        {!s.available ? (
          <span className="absolute bottom-2 left-2 z-10 rounded-[3px] bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white/90">
            {t("card.soldout")}
          </span>
        ) : (
          lowStock && (
            <span className="absolute bottom-2 left-2 z-10 rounded-[3px] bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-accent-200">
              {t("card.last", { n: product.stock })}
            </span>
          )
        )}
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-3.5">
        {product.name && (
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-ink">
            <Link href={href} className="transition-colors hover:text-accent-300">
              {product.name}
            </Link>
          </h3>
        )}
        {(product.reviewCount || 0) > 0 && (
          <Link
            href={`${href}#resenas`}
            className="mt-1 inline-flex items-center gap-1.5"
          >
            <MiniStars rating={product.ratingAvg} />
            <span className="text-[11px] text-ink-muted">
              ({product.reviewCount})
            </span>
          </Link>
        )}

        <div className="mt-auto pt-3">
          <div className="flex items-baseline gap-2 leading-tight">
            <span className="text-base font-bold tracking-tight text-ink">
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
            className={`btn-accent mt-2 w-full px-3 py-2 text-xs ${added ? "!bg-accent-400" : ""}`}
          >
            {!s.available ? (
              t("card.soldout")
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
                {t("card.added")}
              </>
            ) : (
              t("card.add")
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

// `product` proviene de datos del servidor (referencia estable entre renders),
// así que memoizamos para no re-renderizar cada tarjeta cuando el grid cambia
// por búsqueda/orden/favoritos sin afectar a este producto.
export default memo(ProductCard);
