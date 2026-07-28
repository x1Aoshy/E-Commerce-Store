"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/format";
import { productImages, isVideo } from "@/lib/images";
import { useToast } from "@/components/Toast";
import dynamic from "next/dynamic";
import { useBranding } from "@/context/BrandingContext";
import { useLang } from "@/context/LanguageContext";
import CopyNumber from "@/components/CopyNumber";
import SmartImage from "@/components/SmartImage";

/* ==========================================================================
   CARRITO / CHECKOUT
   --------------------------------------------------------------------------
   Es la pantalla donde se gana o se pierde el pedido, así que todo lo que
   distrae se fue y todo lo que tranquiliza se quedó:

   · El TOTAL vive fijo al pie, en tipografía de póster. Nunca hay que
     scrollear para saber cuánto se va a pagar.
   · El cupón también está fijo: en escritorio quedaba enterrado al final del
     formulario y la gente no lo encontraba.
   · Los datos del cliente son TODOS opcionales. Cada campo obligatorio en un
     checkout por WhatsApp es un pedido menos.
   · Debajo del botón, las formas de pago y el recordatorio de que se paga al
     recibir: la última objeción, respondida en el último instante.

   El drawer entra desde abajo en móvil (pulgar) y desde la derecha en
   escritorio (patrón esperado).
   ========================================================================== */

// El generador de QR (lib `qrcode`) se carga sólo al mostrar el recibo, para no
// pesar en el bundle inicial de todas las páginas.
const QRCode = dynamic(() => import("@/components/QRCode"), {
  ssr: false,
  loading: () => <div className="h-[148px] w-[148px] animate-pulse bg-fill/10" />,
});

function WhatsAppIcon({ className = "h-5 w-5" }: any) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3z" />
      <path d="M8.5 9c0 4 2.5 6.5 6.5 6.5" />
    </svg>
  );
}

export default function CartDrawer() {
  const { items, isOpen, closeCart, updateQty, removeItem, addItem, total, clear } =
    useCart();
  const router = useRouter();
  const toast = useToast();
  const { whatsappNumber, paymentInfo } = useBranding();
  const { t } = useLang();
  const phone = (whatsappNumber || "").replace(/[^\d]/g, "");

  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  // Teléfono del CLIENTE (opcional); distinto de `phone`, que es el de la tienda.
  const [custPhone, setCustPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [success, setSuccess] = useState<any>(null);

  /* Cupón de descuento. Guardamos { code, percent } tras validarlo contra la
     API pública para mostrar el desglose al instante; el monto REAL lo
     recalcula el servidor al crear el pedido (acá es sólo informativo).
     OJO: estos hooks deben vivir ANTES del `if (!render) return null`. */
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const [render, setRender] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setConflicts([]);
      setSuccess(null);
      // El cupón aplicado se conserva (igual que el carrito); sólo limpiamos el
      // mensaje de error para no arrastrar avisos viejos al reabrir.
      setCouponError(null);
      setRender(true);
      document.body.style.overflow = "hidden";
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    setVisible(false);
    document.body.style.overflow = "";
    const id = setTimeout(() => setRender(false), 340);
    return () => clearTimeout(id);
  }, [isOpen]);

  useEffect(
    () => () => {
      document.body.style.overflow = "";
    },
    []
  );

  // Escape cierra el carrito (esperado en escritorio).
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeCart();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, closeCart]);

  /* --------------------- Cross-sell: "Completá tu pedido" -------------------
     Trae el catálogo UNA sola vez (guardado con un ref) recién cuando el drawer
     se abre con productos, para sugerir hasta 2 complementos sin pegarle a la
     API en cada render. Si falla, no se muestra nada (no bloquea el checkout). */
  const [catalog, setCatalog] = useState<any[]>([]);
  const catalogFetched = useRef(false);

  useEffect(() => {
    if (!isOpen || items.length === 0 || catalogFetched.current) return;
    catalogFetched.current = true;
    fetch("/api/products")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.products)) setCatalog(data.products);
      })
      .catch(() => {
        /* silencio: el bloque simplemente no aparece */
      });
  }, [isOpen, items.length]);

  const suggestions = useMemo(() => {
    if (catalog.length === 0 || items.length === 0) return [];
    const inCart = new Set(items.map((i) => i.id));
    const cartCategories = new Set(items.map((i) => i.category).filter(Boolean));
    const available = catalog.filter(
      (p) => p && (Number(p.stock) || 0) > 0 && !inCart.has(p.id)
    );
    // Preferimos la misma categoría de lo que ya lleva (complementos naturales);
    // como respaldo, los destacados primero y después el resto.
    const sameCat = available.filter((p) => cartCategories.has(p.category));
    const rest = available
      .filter((p) => !cartCategories.has(p.category))
      .sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
    return [...sameCat, ...rest].slice(0, 2);
  }, [catalog, items]);

  // Miniaturas para las filas: el carrito guarda sólo id/nombre/precio, así que
  // la foto se busca en el catálogo ya traído para el cross-sell.
  const thumbById = useMemo(() => {
    const m = new Map();
    for (const p of catalog) {
      const img = productImages(p).find((u) => !isVideo(u));
      if (img) m.set(p.id, img);
    }
    return m;
  }, [catalog]);

  const itemCount = items.reduce((n, i) => n + i.quantity, 0);

  if (!render) return null;

  // Descuento ESTIMADO en el cliente (misma fórmula que el servidor). Sirve
  // para el desglose visual; el cobro final siempre sale del recálculo server.
  const discount = appliedCoupon
    ? Math.round((total * (Number(appliedCoupon.percent) || 0)) / 100)
    : 0;

  async function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code || couponLoading) return;
    setCouponLoading(true);
    setCouponError(null);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      // El 429 del rate limit puede venir sin JSON: no rompemos el flujo.
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.valid) {
        setAppliedCoupon({ code: data.code, percent: Number(data.percent) || 0 });
        setCouponInput("");
      } else {
        // Cupón inválido/vencido: soltamos el que estuviera aplicado para que el
        // total mostrado nunca prometa un descuento que el server rechazará.
        setAppliedCoupon(null);
        setCouponError(data.error || "No se pudo validar el cupón. Intentá de nuevo.");
      }
    } catch {
      setAppliedCoupon(null);
      setCouponError("Error de conexión. Intentá de nuevo.");
    } finally {
      setCouponLoading(false);
    }
  }

  async function checkout() {
    if (items.length === 0) return;
    setLoading(true);
    setError(null);
    setConflicts([]);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ id: i.id, quantity: i.quantity })),
          customer: { name, note, phone: custPhone },
          // El server revalida el código y calcula el descuento por su cuenta.
          couponCode: appliedCoupon?.code,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        const msg = data.error || "No se pudo procesar el pedido.";
        setError(msg);
        setConflicts(data.conflicts || []);
        toast.error(msg);
        setLoading(false);
        return;
      }

      // No abrimos WhatsApp por código (en móvil eso suele caer en la página de
      // descarga). Mostramos la pantalla de éxito con un LINK real que el
      // usuario toca: así el deep-link al chat funciona a la primera.
      setSuccess({
        code: data.order.code,
        whatsappUrl: data.whatsappUrl,
        token: data.order.token,
      });
      toast.success("¡Pedido creado!");
      clear();
      setName("");
      setNote("");
      setCustPhone("");
      // El cupón ya quedó registrado en el pedido: lo soltamos para que no se
      // reutilice sin querer en la próxima compra.
      setAppliedCoupon(null);
      setCouponInput("");
      setCouponError(null);
      router.refresh();
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
      toast.error("Error de conexión. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div
        className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={closeCart}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t("cart.title")}
        className={`absolute inset-x-0 bottom-0 flex max-h-[92vh] transform-gpu flex-col border-t-2 border-accent-400 bg-night shadow-card transition-transform duration-300 ease-out md:inset-y-0 md:bottom-auto md:left-auto md:right-0 md:h-full md:max-h-none md:w-full md:max-w-[440px] md:border-l md:border-t-0 md:border-l-line/15 ${
          visible
            ? "translate-y-0 md:translate-x-0"
            : "translate-y-full md:translate-y-0 md:translate-x-full"
        }`}
      >
        {/* Asa de arrastre en móvil. */}
        <div className="mx-auto mt-3 h-1 w-10 shrink-0 bg-fill/20 md:hidden" />

        {/* ============================ Cabecera ========================== */}
        <div className="flex shrink-0 items-center justify-between border-b border-line/12 px-5 py-4">
          <div>
            <h2 className="headline text-2xl text-ink">{t("cart.title")}</h2>
            {itemCount > 0 && !success && (
              <p className="tnum mt-0.5 font-mono text-[10px] uppercase tracking-widest2 text-ink-muted">
                {itemCount === 1 ? t("cart.itemOne") : t("cart.items", { n: itemCount })}
              </p>
            )}
          </div>
          <button
            onClick={closeCart}
            className="flex h-10 w-10 items-center justify-center border border-transparent text-ink-soft transition-colors hover:border-line/20 hover:text-ink"
            aria-label="Cerrar carrito"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {success ? (
          /* ====================== Pedido registrado ==================== */
          <div className="flex flex-1 flex-col items-center overflow-y-auto px-6 py-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center bg-green-400 text-[#052e16]">
              <WhatsAppIcon className="h-8 w-8" />
            </div>
            <h3 className="headline mt-5 text-3xl text-ink">{t("cart.okTitle")}</h3>
            <p className="mt-3 max-w-xs text-[13.5px] leading-relaxed text-ink-soft">
              {t("cart.okBody", { code: success.code })}
            </p>

            {/* Código QR del recibo: privado, lleva al detalle de la compra. */}
            {success.token && (
              <div className="mt-6 flex flex-col items-center">
                <div className="border-2 border-line/85 bg-white p-3 shadow-hard-sm">
                  <QRCode
                    value={`${
                      typeof window !== "undefined" ? window.location.origin : ""
                    }/recibo/${success.token}`}
                    size={148}
                  />
                </div>
                <p className="mt-3 font-mono text-[10px] uppercase tracking-widest2 text-ink-muted">
                  {t("cart.receipt")}
                </p>
                <a
                  href={`/recibo/${success.token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-underline mt-2 text-[12px] font-bold text-brand"
                >
                  {t("cart.viewReceipt")}
                </a>
              </div>
            )}

            {/* ¿Cómo pagar? Datos configurados en Ajustes: el cliente los ve al
                instante, sin tener que preguntarlos por chat. */}
            {paymentInfo && (
              <div className="mt-6 w-full border border-accent-400/30 bg-accent-400/[0.07] px-4 py-3.5 text-left">
                <p className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
                  {t("cart.howPay")}
                </p>
                <p className="mt-2 whitespace-pre-line text-[13.5px] leading-relaxed text-ink-soft">
                  {paymentInfo}
                </p>
              </div>
            )}

            <a
              href={success.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-wa mt-7 w-full py-4 text-sm"
            >
              <WhatsAppIcon className="h-5 w-5" /> {t("cart.openWa")}
            </a>

            {/* Alternativa por si el chat no abre (típico en PC). */}
            {phone && (
              <div className="mt-4 w-full">
                <p className="text-[11.5px] text-ink-muted">{t("cart.copyHint")}</p>
                <CopyNumber className="mt-2 w-full justify-center" />
              </div>
            )}

            <button onClick={closeCart} className="btn-ghost mt-3 w-full py-3.5">
              {t("cart.keep")}
            </button>
          </div>
        ) : items.length === 0 ? (
          /* ========================= Carrito vacío ===================== */
          <div className="flex flex-1 flex-col items-center justify-center px-8 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center border border-line/15 text-ink-muted">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 4h2l2.4 12.3a1 1 0 0 0 1 .7h8.7a1 1 0 0 0 1-.8L21 8H6" />
                <circle cx="9.5" cy="20" r="1.4" />
                <circle cx="17.5" cy="20" r="1.4" />
              </svg>
            </div>
            <p className="headline mt-5 text-2xl text-ink">{t("cart.emptyTitle")}</p>
            <p className="mt-2 text-[13.5px] text-ink-muted">{t("cart.emptySub")}</p>
            <button onClick={closeCart} className="btn-accent mt-7 px-7">
              {t("cart.seeProducts")}
            </button>
          </div>
        ) : (
          <>
            {/* ========================== Productos ====================== */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
              <ul className="divide-y divide-line/10">
                {items.map((item) => (
                  <li key={item.id} className="flex gap-3.5 py-4 first:pt-0">
                    {thumbById.get(item.id) ? (
                      <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden border border-line/12 bg-surface-soft">
                        <SmartImage
                          src={thumbById.get(item.id)}
                          alt=""
                          sizes="72px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center border border-line/12 bg-surface-soft text-ink-muted">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <rect x="3" y="5" width="18" height="14" rx="1" />
                          <circle cx="8.5" cy="10" r="1.5" />
                          <path d="M21 16l-5-5L5 19" />
                        </svg>
                      </div>
                    )}

                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <p className="line-clamp-2 text-[13px] font-bold leading-snug text-ink">
                          {item.name || "Producto"}
                        </p>
                        <span className="tnum shrink-0 font-display text-lg leading-none text-ink">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                      <p className="tnum mt-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                        {formatPrice(item.price)} {t("cart.each")}
                      </p>

                      <div className="mt-auto flex items-center gap-3 pt-2.5">
                        <div className="flex items-center border border-line/18">
                          <button
                            onClick={() => updateQty(item.id, item.quantity - 1)}
                            className="flex h-8 w-8 items-center justify-center text-ink-soft transition-colors hover:bg-fill/5 hover:text-ink"
                            aria-label="Restar"
                          >
                            −
                          </button>
                          <span className="tnum w-8 text-center text-[13px] font-bold">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQty(item.id, item.quantity + 1)}
                            className="flex h-8 w-8 items-center justify-center text-ink-soft transition-colors hover:bg-fill/5 hover:text-ink disabled:opacity-25"
                            disabled={item.quantity >= (item.stock ?? 99)}
                            aria-label="Sumar"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="font-mono text-[10px] uppercase tracking-widest2 text-ink-muted underline-offset-4 transition-colors hover:text-urgent hover:underline"
                        >
                          {t("cart.remove")}
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Cross-sell: hasta 2 complementos con stock que todavía no están
                  en el carrito. Sube el ticket promedio sin estorbar. */}
              {suggestions.length > 0 && (
                <div className="mt-5 border-t border-line/12 pt-5">
                  <p className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
                    {t("cart.crossSell")}
                  </p>
                  <ul className="mt-3 space-y-2">
                    {suggestions.map((p) => {
                      const thumb = productImages(p).find((u) => !isVideo(u));
                      return (
                        <li
                          key={p.id}
                          className="flex items-center gap-3 border border-line/12 p-2.5"
                        >
                          {thumb && (
                            <div className="relative h-11 w-11 shrink-0 overflow-hidden bg-surface-soft">
                              <SmartImage src={thumb} alt="" sizes="44px" className="object-cover" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[12.5px] font-bold text-ink">
                              {p.name || p.category || "Producto"}
                            </p>
                            <p className="tnum mt-0.5 font-mono text-[10px] text-ink-muted">
                              {formatPrice(p.price)}
                            </p>
                          </div>
                          <button
                            onClick={() => addItem(p)}
                            className="shrink-0 border border-line/20 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-ink-soft transition-all duration-200 hover:border-accent-400 hover:bg-accent-400 hover:text-[#17130a]"
                          >
                            {t("cart.addShort")}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {error && (
                <div className="mt-5 border border-ember-500/40 bg-ember-500/10 p-3.5 text-[13px] text-urgent">
                  <p className="font-bold">{error}</p>
                  {conflicts.length > 0 && (
                    <ul className="mt-1.5 list-inside list-disc text-[12px]">
                      {conflicts.map((c, i) => (
                        <li key={i}>
                          {c.name ? `${c.name}: ` : ""}
                          {c.reason}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Datos del cliente: TODOS opcionales a propósito. */}
              <div className="mt-5 space-y-3 border-t border-line/12 pt-5">
                <div>
                  <label className="label" htmlFor="cart-name">
                    {t("cart.name")}
                  </label>
                  <input
                    id="cart-name"
                    className="input h-11 min-h-0 text-sm"
                    placeholder={t("cart.namePh")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="cart-phone">
                    {t("cart.phone")}
                  </label>
                  <input
                    id="cart-phone"
                    className="input h-11 min-h-0 text-sm"
                    inputMode="tel"
                    placeholder={t("cart.phonePh")}
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="cart-note">
                    {t("cart.note")}
                  </label>
                  <textarea
                    id="cart-note"
                    className="input min-h-[70px] resize-none py-2.5 text-sm"
                    placeholder={t("cart.notePh")}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* ============================ Pie fijo ===================== */}
            <div
              className="shrink-0 border-t border-line/12 bg-surface/40 px-5 pt-4"
              style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
            >
              {/* Cupón SIEMPRE visible: antes vivía al final del formulario y en
                  PC quedaba fuera de vista. */}
              <div className="mb-3.5">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between gap-3 border border-green-400/40 bg-green-400/10 px-3 py-2.5 text-[12.5px] font-bold text-ok">
                    <span className="min-w-0 truncate">
                      {t("cart.couponOn", {
                        code: appliedCoupon.code,
                        p: appliedCoupon.percent,
                      })}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAppliedCoupon(null);
                        setCouponError(null);
                      }}
                      className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
                    >
                      {t("cart.remove")}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <input
                        className="input h-11 min-h-0 flex-1 text-sm"
                        placeholder={t("cart.couponPh")}
                        autoComplete="off"
                        value={couponInput}
                        // Mayúsculas al tipear: los códigos se guardan así y
                        // evita rechazos por "titan10" vs "TITAN10".
                        onChange={(e) => {
                          setCouponInput(e.target.value.toUpperCase());
                          if (couponError) setCouponError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            applyCoupon();
                          }
                        }}
                        aria-label="Código de cupón"
                      />
                      <button
                        type="button"
                        onClick={applyCoupon}
                        disabled={couponLoading || !couponInput.trim()}
                        className="btn-ghost h-11 min-h-0 shrink-0 px-4 text-[10px]"
                      >
                        {couponLoading ? t("cart.validating") : t("cart.apply")}
                      </button>
                    </div>
                    {couponError && (
                      <p className="mt-1.5 text-[11.5px] text-urgent">{couponError}</p>
                    )}
                  </>
                )}
              </div>

              {/* Desglose. Con cupón se muestra explícito cuánto se ahorra. */}
              {appliedCoupon ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-ink-soft">{t("cart.subtotal")}</span>
                    <span className="tnum font-medium text-ink-soft">
                      {formatPrice(total)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[13px] font-bold text-ok">
                    <span>{t("cart.discount", { code: appliedCoupon.code })}</span>
                    <span className="tnum">−{formatPrice(discount)}</span>
                  </div>
                  <div className="flex items-end justify-between border-t border-line/12 pt-2.5">
                    <span className="font-mono text-[10px] uppercase tracking-widest2 text-ink-muted">
                      {t("cart.total")}
                    </span>
                    <span className="tnum font-display text-3xl leading-none text-ink">
                      {formatPrice(Math.max(0, total - discount))}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-end justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-widest2 text-ink-muted">
                    {t("cart.total")}
                  </span>
                  <span className="tnum font-display text-3xl leading-none text-ink">
                    {formatPrice(total)}
                  </span>
                </div>
              )}

              <button
                onClick={checkout}
                disabled={loading}
                className="btn-wa mt-4 w-full py-4 text-sm"
              >
                {loading ? (
                  t("cart.processing")
                ) : (
                  <>
                    <WhatsAppIcon className="h-5 w-5" /> {t("cart.checkout")}
                  </>
                )}
              </button>

              <p className="mt-2.5 text-center text-[11px] text-ink-muted">
                {t("cart.willOpen")}
              </p>

              {/* Métodos de pago ANTES de confirmar: menos dudas, más pedidos
                  terminados. */}
              <div className="mt-2.5 flex items-center justify-center gap-4 border-t border-line/10 pt-2.5">
                {[
                  {
                    label: t("cart.cash"),
                    path: <><rect x="2" y="6" width="20" height="12" rx="1" /><circle cx="12" cy="12" r="2.5" /></>,
                  },
                  {
                    label: t("cart.transfer"),
                    path: <path d="M4 10h16M4 10l3-6h10l3 6M6 10v9h12v-9" />,
                  },
                  {
                    label: t("cart.payConfirm"),
                    path: <><path d="M12 3 4 6v6c0 5 3.4 8 8 9 4.6-1 8-4 8-9V6z" /><path d="m9 12 2 2 4-4" /></>,
                  },
                ].map((m) => (
                  <span
                    key={m.label}
                    className="inline-flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-wider text-ink-muted"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      {m.path}
                    </svg>
                    {m.label}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
