"use client";

import { useCart } from "@/context/CartContext";
import { useLang } from "@/context/LanguageContext";
import { useCurrency } from "@/context/CurrencyContext";

// Barra de carrito fija al pie en móvil: siempre al alcance del pulgar.
// Aparece deslizándose hacia arriba cuando hay productos y el carrito está
// cerrado, e incluye safe-area para no quedar tapada por la barra del iPhone.
//
// En móvil esta barra ES el checkout: mientras exista un carrito con algo
// dentro, el botón de cerrar el pedido nunca sale de la pantalla.
export default function MobileCartBar() {
  const { formatPrice } = useCurrency();
  const { count, total, openCart, isOpen, hydrated } = useCart();
  const { t } = useLang();
  const show = hydrated && count > 0 && !isOpen;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 transition-transform duration-300 ease-out md:hidden ${
        show ? "translate-y-0" : "translate-y-[140%]"
      }`}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-hidden={!show}
    >
      <button
        onClick={openCart}
        tabIndex={show ? 0 : -1}
        className="flex w-full items-center gap-3 border-t-2 border-accent-400 bg-surface px-4 py-3 text-left text-ink shadow-card transition active:translate-y-px"
      >
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center bg-accent-400 text-[#17130a]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 4h2l2.4 12.3a1 1 0 0 0 1 .7h8.7a1 1 0 0 0 1-.8L21 8H6" />
            <circle cx="9.5" cy="20" r="1.4" />
            <circle cx="17.5" cy="20" r="1.4" />
          </svg>
          {count > 0 && (
            <span className="tnum absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center bg-ember-400 px-1 text-[10px] font-extrabold text-white">
              {count}
            </span>
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block font-mono text-[9.5px] uppercase tracking-widest2 text-ink-muted">
            {count} {count === 1 ? t("mob.one") : t("mob.many")}
          </span>
          <span className="tnum block font-display text-xl leading-tight text-ink">
            {formatPrice(total)}
          </span>
        </span>

        <span className="inline-flex shrink-0 items-center gap-1.5 bg-ink px-5 py-3 text-[11px] font-extrabold uppercase tracking-[0.08em] text-night">
          {t("mob.view")}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
      </button>
    </div>
  );
}
