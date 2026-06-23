"use client";

import { useCart } from "@/context/CartContext";

const STORE = process.env.NEXT_PUBLIC_STORE_NAME || "Aosh Suplementos";

function LogoMark() {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#15191c" />
      <path
        d="M16 8c3.6 3.1 5.6 5.7 5.6 8.6A5.6 5.6 0 0 1 16 22.2a5.6 5.6 0 0 1-5.6-5.6C10.4 13.7 12.4 11.1 16 8z"
        fill="#2f9d77"
      />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 4h2l2.4 12.3a1 1 0 0 0 1 .7h8.7a1 1 0 0 0 1-.8L21 8H6" />
      <circle cx="9.5" cy="20" r="1.4" />
      <circle cx="17.5" cy="20" r="1.4" />
    </svg>
  );
}

export default function Header() {
  const { count, openCart, hydrated } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-ink/[0.06] bg-white/80 backdrop-blur-md">
      <div className="container-content flex h-16 items-center justify-between">
        <a href="#top" className="flex items-center gap-2.5">
          <LogoMark />
          <span className="text-[15px] font-semibold tracking-tight text-ink">
            {STORE}
          </span>
        </a>

        <nav className="hidden items-center gap-8 text-sm text-ink-soft md:flex">
          <a href="#productos" className="transition hover:text-ink">
            Productos
          </a>
          <a href="#beneficios" className="transition hover:text-ink">
            Beneficios
          </a>
          <a href="#contacto" className="transition hover:text-ink">
            Contacto
          </a>
        </nav>

        <button
          onClick={openCart}
          className="relative inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-sm font-medium text-ink transition hover:border-ink/40"
          aria-label="Abrir carrito"
        >
          <CartIcon />
          <span className="hidden sm:inline">Carrito</span>
          {hydrated && count > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent-500 px-1 text-[11px] font-semibold text-white">
              {count}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
