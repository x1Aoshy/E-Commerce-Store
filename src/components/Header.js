"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { useCart } from "@/context/CartContext";

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

// Lleva al usuario a una categoría: si ya está en la home, filtra al instante
// (vía evento) y baja a los productos; si está en otra página, navega a la home
// con la categoría en la URL.
function goCategory(cat) {
  if (typeof window === "undefined") return;
  if (window.location.pathname === "/") {
    window.dispatchEvent(new CustomEvent("titan:category", { detail: cat }));
    document.getElementById("productos")?.scrollIntoView({ behavior: "smooth" });
  } else {
    window.location.href = `/?categoria=${encodeURIComponent(cat)}#productos`;
  }
}

export default function Header({ categories = [] }) {
  const { count, openCart, hydrated } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [bump, setBump] = useState(false);
  const prevCount = useRef(count);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Anima el botón del carrito cuando aumenta la cantidad (se agregó algo).
  useEffect(() => {
    if (count > prevCount.current) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 450);
      prevCount.current = count;
      return () => clearTimeout(t);
    }
    prevCount.current = count;
  }, [count]);

  const navCats = ["Todos", ...categories];

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-all duration-300 ${
        scrolled
          ? "border-white/10 bg-night shadow-soft"
          : "border-white/[0.06] bg-night"
      }`}
    >
      <div className="container-content flex h-16 items-center justify-between gap-4">
        <Link href="/" className="transition active:scale-95">
          <Logo />
        </Link>

        <button
          onClick={openCart}
          className={`relative inline-flex items-center gap-2 rounded-[4px] border border-white/15 px-4 py-2 text-sm font-medium text-ink transition hover:border-white/35 hover:bg-white/5 active:scale-95 ${
            bump ? "animate-cart-bump border-accent-500/50" : ""
          }`}
          aria-label="Abrir carrito"
        >
          <CartIcon />
          <span className="hidden sm:inline">Carrito</span>
          {hydrated && count > 0 && (
            <span
              key={count}
              className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] animate-pop items-center justify-center rounded-full bg-accent-500 px-1 text-[11px] font-semibold text-night"
            >
              {count}
            </span>
          )}
        </button>
      </div>

      {categories.length > 0 && (
        <div className="border-t border-white/[0.06]">
          <div className="container-content">
            <div className="no-scrollbar -mx-5 flex items-center gap-0.5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
              {navCats.map((c) => (
                <button
                  key={c}
                  onClick={() => goCategory(c)}
                  className="shrink-0 whitespace-nowrap rounded-[4px] px-3 py-2.5 text-[13px] font-medium text-ink-soft transition hover:text-accent-300"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
