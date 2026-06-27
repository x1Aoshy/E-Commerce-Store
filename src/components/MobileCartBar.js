"use client";

import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/format";

// Barra de carrito fija al pie en mobile: siempre al alcance del pulgar.
// Aparece deslizándose hacia arriba cuando hay productos y el carrito está
// cerrado. Incluye safe-area para no quedar tapada por la barra del iPhone.
export default function MobileCartBar() {
  const { count, total, openCart, isOpen, hydrated } = useCart();
  const show = hydrated && count > 0 && !isOpen;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 px-3 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:hidden ${
        show ? "translate-y-0" : "translate-y-[140%]"
      }`}
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      aria-hidden={!show}
    >
      <button
        onClick={openCart}
        tabIndex={show ? 0 : -1}
        className="flex w-full items-center gap-3 rounded-[4px] border border-line/10 bg-surface p-2 pl-4 text-left text-ink shadow-card transition active:scale-[0.98]"
      >
        <span className="flex h-6 w-6 items-center justify-center text-accent-300">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 4h2l2.4 12.3a1 1 0 0 0 1 .7h8.7a1 1 0 0 0 1-.8L21 8H6" />
            <circle cx="9.5" cy="20" r="1.4" />
            <circle cx="17.5" cy="20" r="1.4" />
          </svg>
        </span>
        <span className="flex-1">
          <span className="block text-[11px] leading-tight text-ink-muted">
            {count} {count === 1 ? "producto" : "productos"}
          </span>
          <span className="block text-sm font-semibold leading-tight text-ink">
            {formatPrice(total)}
          </span>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-[4px] bg-accent-500 px-4 py-2.5 text-sm font-semibold text-[#1a1306]">
          Ver pedido
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </span>
      </button>
    </div>
  );
}
