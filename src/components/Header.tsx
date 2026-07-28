"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import Marquee from "@/components/motion/Marquee";
import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoritesContext";
import { useLang } from "@/context/LanguageContext";

/* --------------------------------- Íconos -------------------------------- */

function CartIcon({ className = "h-[19px] w-[19px]" }: any) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
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

function SearchIcon({ className = "h-[19px] w-[19px]" }: any) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </svg>
  );
}

function HeartIcon({ className = "h-[19px] w-[19px]" }: any) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20s-7.5-4.6-7.5-9.5A4.5 4.5 0 0 1 12 7.6a4.5 4.5 0 0 1 7.5 2.9C19.5 15.4 12 20 12 20z" />
    </svg>
  );
}

/* -------------------------------- Navegación ------------------------------ */

// Lleva a una categoría: si ya estamos en la home filtra al instante (evento)
// y baja al catálogo; si no, navega a la home con la categoría en la URL.
function goCategory(cat: string) {
  if (typeof window === "undefined") return;
  if (window.location.pathname === "/") {
    window.dispatchEvent(new CustomEvent("titan:category", { detail: cat }));
    document.getElementById("productos")?.scrollIntoView({ behavior: "smooth" });
  } else {
    window.location.href = `/?categoria=${encodeURIComponent(cat)}#productos`;
  }
}

// Dispara la búsqueda del catálogo (misma mecánica que las categorías).
function goSearch(q: string) {
  if (typeof window === "undefined") return;
  if (window.location.pathname === "/") {
    window.dispatchEvent(new CustomEvent("titan:search", { detail: q }));
    document.getElementById("productos")?.scrollIntoView({ behavior: "smooth" });
  } else {
    window.location.href = `/?q=${encodeURIComponent(q)}#productos`;
  }
}

/* --------------------------------- Header --------------------------------- */

export default function Header({ categories = [] }: { categories?: string[] }) {
  const { count, openCart, hydrated } = useCart();
  const { count: favCount } = useFavorites();
  const { t } = useLang();

  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [bump, setBump] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const prevCount = useRef(count);
  const searchRef = useRef<HTMLInputElement | null>(null);

  // Un solo listener de scroll para el estado compacto Y la barra de progreso
  // de lectura. Se lee en rAF para no forzar layout en cada evento.
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY;
        setScrolled(y > 12);
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(max > 0 ? Math.min(1, y / max) : 0);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // El carrito "salta" cuando entra un producto: refuerzo visual del vuelo.
  useEffect(() => {
    if (count > prevCount.current) {
      setBump(true);
      const id = setTimeout(() => setBump(false), 450);
      prevCount.current = count;
      return () => clearTimeout(id);
    }
    prevCount.current = count;
  }, [count]);

  // Al abrir el buscador, el foco va al campo. Escape lo cierra.
  useEffect(() => {
    if (!searchOpen) return;
    searchRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSearchOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen]);

  const submitSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      goSearch(query.trim());
      setSearchOpen(false);
    },
    [query]
  );

  const ticker = [
    t("hero.trust1"),
    t("hero.trust2"),
    t("hero.trust3"),
    t("ticker.original"),
    t("ticker.support"),
  ];

  return (
    <>
      {/* ====================== CINTA DE ANUNCIOS (en movimiento) ============
          Un ticker que corre es la diferencia entre una tienda encendida y una
          plantilla. Va FUERA del header sticky: se va con el scroll y no roba
          altura útil. */}
      <div className="relative z-30 border-b border-line/10 bg-ink text-night">
        <Marquee speed={38} itemClassName="px-6 py-2">
          {ticker.map((txt) => (
            <span
              key={txt}
              className="flex items-center gap-2.5 font-mono text-[10.5px] font-bold uppercase tracking-widest2"
            >
              <span className="inline-block h-1.5 w-1.5 rotate-45 bg-accent-500" aria-hidden="true" />
              {txt}
            </span>
          ))}
        </Marquee>
      </div>

      {/* ============================== HEADER ============================== */}
      <header
        className={`sticky top-0 z-40 transition-[background-color,box-shadow,border-color] duration-300 ${
          scrolled
            ? "border-b border-line/12 bg-night shadow-soft"
            : "border-b border-transparent bg-night"
        }`}
      >
        <div className="container-content flex h-[68px] items-center justify-between gap-4">
          <Link
            href="/"
            aria-label="Inicio"
            className="shrink-0 transition-transform duration-200 active:scale-95"
          >
            <Logo />
          </Link>

          {/* Navegación de categorías en ESCRITORIO: se ve completa, sin menú
              hamburguesa. En una tienda chica, esconder el catálogo cuesta
              ventas. */}
          {categories.length > 0 && (
            <nav className="hidden min-w-0 items-center gap-1 lg:flex">
              <button
                onClick={() => goCategory("Todos")}
                className="whitespace-nowrap px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-widest2 text-ink-soft transition-colors hover:text-accent-300"
              >
                {t("grid.all")}
              </button>
              {categories.slice(0, 5).map((c) => (
                <button
                  key={c}
                  onClick={() => goCategory(c)}
                  className="whitespace-nowrap px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-widest2 text-ink-soft transition-colors hover:text-accent-300"
                >
                  {c}
                </button>
              ))}
            </nav>
          )}

          <div className="flex shrink-0 items-center gap-1">
            {/* Buscar */}
            <button
              onClick={() => setSearchOpen((v) => !v)}
              aria-label={t("header.search")}
              aria-expanded={searchOpen}
              className="flex h-11 w-11 items-center justify-center border border-transparent text-ink-soft transition-colors hover:border-line/20 hover:text-ink"
            >
              <SearchIcon />
            </button>

            {/* Favoritos: sólo si hay alguno (nunca un cero vacío). */}
            {hydrated && favCount > 0 && (
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("titan:favorites"));
                  document.getElementById("productos")?.scrollIntoView({ behavior: "smooth" });
                }}
                aria-label={t("grid.favorites")}
                className="relative hidden h-11 w-11 items-center justify-center border border-transparent text-ink-soft transition-colors hover:border-line/20 hover:text-ember-400 sm:flex"
              >
                <HeartIcon />
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-ember-400" />
              </button>
            )}

            {/* Carrito. `data-cart-anchor` es el destino del vuelo al carrito. */}
            <button
              onClick={openCart}
              data-cart-anchor
              aria-label={t("header.cart")}
              className={`relative ml-1 inline-flex h-11 items-center gap-2.5 border border-line/20 px-4 text-[12px] font-extrabold uppercase tracking-[0.08em] text-ink transition-all duration-200 hover:border-accent-400 hover:bg-accent-400 hover:text-[#17130a] active:translate-y-px ${
                bump ? "animate-cart-bump border-accent-400" : ""
              }`}
            >
              <CartIcon />
              <span className="hidden sm:inline">{t("header.cart")}</span>
              {hydrated && count > 0 && (
                <span
                  key={count}
                  className="tnum absolute -right-2 -top-2 flex h-5 min-w-[20px] animate-pop items-center justify-center bg-ember-400 px-1 text-[11px] font-extrabold text-white"
                >
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Categorías deslizables en MÓVIL/TABLET. */}
        {categories.length > 0 && (
          <div className="border-t border-line/[0.08] lg:hidden">
            <div className="container-content">
              <div className="no-scrollbar -mx-5 flex items-center gap-1 overflow-x-auto px-5 sm:mx-0 sm:px-0">
                <button
                  onClick={() => goCategory("Todos")}
                  className="shrink-0 whitespace-nowrap px-3 py-2.5 font-mono text-[10.5px] font-bold uppercase tracking-widest2 text-ink-soft transition-colors hover:text-accent-300"
                >
                  {t("grid.all")}
                </button>
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => goCategory(c)}
                    className="shrink-0 whitespace-nowrap px-3 py-2.5 font-mono text-[10.5px] font-bold uppercase tracking-widest2 text-ink-soft transition-colors hover:text-accent-300"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Barra de progreso de lectura: hilo de oro al pie del header. Dice
            "cuánto falta" sin ocupar espacio. */}
        <div
          className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-accent-400 transition-transform duration-150 ease-out"
          style={{ transform: `scaleX(${progress})` }}
          aria-hidden="true"
        />

        {/* ---------------------- Panel de búsqueda ---------------------- */}
        <div
          className={`absolute inset-x-0 top-full origin-top border-b border-line/12 bg-night transition-all duration-300 ease-out ${
            searchOpen
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none -translate-y-3 opacity-0"
          }`}
        >
          <form onSubmit={submitSearch} className="container-content flex items-center gap-3 py-5">
            <SearchIcon className="h-5 w-5 shrink-0 text-ink-muted" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("grid.search")}
              aria-label={t("grid.search")}
              tabIndex={searchOpen ? 0 : -1}
              className="min-w-0 flex-1 border-0 bg-transparent p-0 text-lg text-ink outline-none placeholder:text-ink-muted/60 focus:ring-0"
            />
            <button type="submit" className="btn-accent h-10 min-h-0 px-5 text-[11px]">
              {t("header.go")}
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              aria-label={t("rev.closeBtn")}
              tabIndex={searchOpen ? 0 : -1}
              className="flex h-10 w-10 shrink-0 items-center justify-center text-ink-muted transition-colors hover:text-ink"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </form>
        </div>
      </header>
    </>
  );
}
