"use client";

import { memo, useRef, useState } from "react";
import Link from "next/link";
import ProductGallery from "./ProductGallery";
import { stockStatus } from "./StockBadge";
import FavoriteButton from "./FavoriteButton";
import { useCurrency } from "@/context/CurrencyContext";
import { useCart } from "@/context/CartContext";
import { useLang } from "@/context/LanguageContext";
import { flyToCart } from "@/lib/flyToCart";

/* ==========================================================================
   TARJETA DE PRODUCTO
   --------------------------------------------------------------------------
   Jerarquía de una tienda real, en este orden exacto:
     FOTO (grande, protagonista) → nombre → prueba (estrellas) → PRECIO → acción.
   Todo lo demás (descripción, ficha técnica) vive en la página del producto:
   una tarjeta que explica es una tarjeta que no vende.

   Detalles que empujan la compra:
   · La acción "Agregar" aparece SOBRE la foto al pasar el cursor (escritorio)
     y está siempre visible en móvil, donde no existe el hover.
   · El descuento se muestra en BRASA y con el ahorro en córdobas: "-20%" es
     abstracto, "ahorrás C$300" es concreto.
   · La urgencia sólo aparece si es verdad (stock real ≤ 5). Nunca inventamos
     escasez: una mentira quema la tienda entera.
   ========================================================================== */

function MiniStars({ rating = 5 }: any) {
  return (
    <span className="inline-flex gap-[1px] text-brand" aria-label={`${rating} de 5`}>
      {Array.from({ length: 5 }).map((_, s) => (
        <svg
          key={s}
          viewBox="0 0 24 24"
          className={`h-[11px] w-[11px] ${s < Math.round(rating) ? "" : "text-line/20"}`}
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="m12 2 3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01z" />
        </svg>
      ))}
    </span>
  );
}

function ProductCard({ product, priority = false }: any) {
  const { formatPrice } = useCurrency();
  const { addItem } = useCart();
  const { t } = useLang();
  const s = stockStatus(product.stock);
  const [added, setAdded] = useState(false);
  const imgWrapRef = useRef<HTMLDivElement | null>(null);

  const href = `/producto/${product.slug}`;
  const onSale = Number(product.compareAt) > Number(product.price);
  const off = onSale ? Math.round((1 - product.price / product.compareAt) * 100) : 0;
  const saving = onSale ? Number(product.compareAt) - Number(product.price) : 0;
  const lowStock = s.available && Number(product.stock) > 0 && Number(product.stock) <= 5;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // El fantasma sale de la FOTO, no del botón: el cliente ve viajar el
    // producto, no un rectángulo cualquiera.
    flyToCart(imgWrapRef.current?.querySelector("img") as HTMLElement);
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <article className="group relative flex h-full flex-col bg-surface transition-colors duration-300 hover:bg-surface-soft">
      {/* ------------------------------- FOTO ------------------------------ */}
      <div
        ref={imgWrapRef}
        className="relative aspect-square w-full overflow-hidden bg-surface-soft"
      >
        <ProductGallery
          product={product}
          href={href}
          priority={priority}
          hoverPlay
          className={`transition-transform duration-[900ms] ease-out group-hover:scale-[1.07] ${
            s.available ? "" : "opacity-50 grayscale"
          }`}
        />

        {/* Barrido de luz al pasar por encima: la foto "responde". */}
        <span
          className="pointer-events-none absolute inset-0 -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-[900ms] ease-out group-hover:translate-x-full"
          aria-hidden="true"
        />

        <FavoriteButton id={product.id} variant="overlay" />

        {/* Etiquetas: oferta (brasa) y agotado/últimas. Máximo dos a la vez. */}
        <div className="pointer-events-none absolute left-0 top-0 z-10 flex flex-col items-start gap-1">
          {onSale && (
            <span className="tag clip-notch bg-ember-500 text-white">−{off}%</span>
          )}
          {product.featured && !onSale && (
            <span className="tag clip-notch bg-accent-400 text-[#17130a]">
              {t("card.top")}
            </span>
          )}
        </div>

        {!s.available ? (
          <span className="absolute inset-x-0 bottom-0 z-10 bg-scrim/85 py-2 text-center font-mono text-[10px] font-bold uppercase tracking-widest2 text-white/80">
            {t("card.soldout")}
          </span>
        ) : (
          lowStock && (
            <span className="absolute bottom-2 left-2 z-10 inline-flex items-center gap-1.5 bg-scrim/85 px-2 py-1 font-mono text-[9.5px] font-bold uppercase tracking-wider text-ember-300">
              <span className="h-1.5 w-1.5 rounded-full bg-ember-400" />
              {t("card.last", { n: product.stock })}
            </span>
          )
        )}

        {/* Acción rápida: sube desde el borde inferior en escritorio. En móvil
            no se usa (allí el botón vive fijo debajo del precio). */}
        {s.available && (
          <div className="absolute inset-x-0 bottom-0 z-10 hidden translate-y-full p-2 transition-transform duration-300 ease-out group-hover:translate-y-0 md:block">
            <button
              onClick={handleAdd}
              aria-live="polite"
              className={`btn-accent h-11 min-h-0 w-full text-[11px] ${
                added ? "!border-green-400 !bg-green-400 !text-[#052e16]" : ""
              }`}
            >
              {added ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12l5 5L20 6" />
                  </svg>
                  {t("card.added")}
                </>
              ) : (
                t("card.quickAdd")
              )}
            </button>
          </div>
        )}
      </div>

      {/* ------------------------------ DATOS ------------------------------ */}
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <p className="font-mono text-[9.5px] uppercase tracking-widest2 text-ink-muted">
          {product.category}
        </p>

        {product.name && (
          <h3 className="mt-1.5 text-[13px] font-bold leading-snug text-ink sm:text-sm">
            <Link href={href} className="transition-colors hover:text-accent-300">
              {/* Área de clic de toda la tarjeta: cubre la foto y el bloque de
                  datos, sin robarle el clic a "Agregar" (que va por encima). */}
              <span className="absolute inset-0 z-0" aria-hidden="true" />
              <span className="relative line-clamp-2">{product.name}</span>
            </Link>
          </h3>
        )}

        {(product.reviewCount || 0) > 0 && (
          <span className="relative z-10 mt-1.5 inline-flex w-fit items-center gap-1.5">
            <MiniStars rating={product.ratingAvg} />
            <span className="tnum text-[10.5px] text-ink-muted">({product.reviewCount})</span>
          </span>
        )}

        {/* --------------------------- PRECIO --------------------------- */}
        <div className="mt-auto pt-3">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="tnum font-display text-xl leading-none text-ink sm:text-2xl">
              {formatPrice(product.price)}
            </span>
            {onSale && (
              <span className="tnum text-[11px] text-ink-muted line-through">
                {formatPrice(product.compareAt)}
              </span>
            )}
          </div>
          {onSale && (
            <p className="mt-1 font-mono text-[9.5px] font-bold uppercase tracking-wider text-urgent">
              {t("card.save", { amount: formatPrice(saving) })}
            </p>
          )}

          {/* Botón en MÓVIL: sin hover, la acción tiene que estar siempre ahí. */}
          <button
            disabled={!s.available}
            onClick={handleAdd}
            aria-live="polite"
            className={`btn-accent relative z-10 mt-3 h-10 min-h-0 w-full text-[11px] md:hidden ${
              added ? "!border-green-400 !bg-green-400 !text-[#052e16]" : ""
            }`}
          >
            {!s.available ? (
              t("card.soldout")
            ) : added ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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

// `product` viene del servidor (referencia estable), así que memoizamos para no
// re-renderizar todas las tarjetas cuando cambia un filtro que no las afecta.
export default memo(ProductCard);
