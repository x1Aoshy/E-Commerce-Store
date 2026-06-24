"use client";

import { useEffect, useState } from "react";
import ProductImage from "./ProductImage";
import StockBadge, { stockStatus } from "./StockBadge";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/context/CartContext";

export default function ProductModal({ product, onClose }) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [show, setShow] = useState(false);
  const s = stockStatus(product.stock);
  const max = Math.max(1, Number(product.stock) || 1);

  const requestClose = () => {
    setShow(false);
    setTimeout(onClose, 220);
  };

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShow(true));
    const onKey = (e) => e.key === "Escape" && requestClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = () => {
    addItem(product, qty);
    requestClose();
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm transition-opacity duration-300 sm:items-center sm:p-6 ${
        show ? "opacity-100" : "opacity-0"
      }`}
      onClick={requestClose}
    >
      <div
        className={`card relative w-full max-w-3xl transform-gpu overflow-hidden rounded-b-none rounded-t-2xl shadow-card transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] sm:rounded-2xl ${
          show
            ? "translate-y-0 sm:scale-100 sm:opacity-100"
            : "translate-y-full sm:translate-y-0 sm:scale-95 sm:opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute left-1/2 top-2.5 z-10 h-1.5 w-10 -translate-x-1/2 rounded-full bg-ink/15 sm:hidden" />

        <button
          onClick={requestClose}
          className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-ink-soft ring-1 ring-ink/10 backdrop-blur transition hover:text-ink active:scale-90"
          aria-label="Cerrar"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <div className="grid sm:grid-cols-2">
          <ProductImage product={product} className="aspect-[4/3] w-full sm:aspect-auto sm:h-full" />

          <div className="flex flex-col p-6 pt-7 sm:p-7">
            <div className="flex items-center gap-2">
              <span className="chip bg-ink/5 text-ink-soft ring-1 ring-ink/10">
                {product.category}
              </span>
              <StockBadge stock={product.stock} />
            </div>

            <h2 className="mt-3 text-xl font-semibold text-ink sm:text-2xl">
              {product.name}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              {product.description || product.short}
            </p>

            <div className="mt-5 text-2xl font-semibold text-ink">
              {formatPrice(product.price)}
            </div>

            {s.available ? (
              <div className="mt-6 flex items-center gap-3">
                <div className="flex items-center rounded-full border border-ink/15">
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
                <button onClick={handleAdd} className="btn-accent flex-1 py-3.5">
                  Agregar al carrito
                </button>
              </div>
            ) : (
              <div className="mt-6 rounded-xl bg-ink/5 px-4 py-3 text-sm text-ink-soft">
                Producto sin stock por el momento. Escribinos por WhatsApp para
                avisarte cuando vuelva.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
