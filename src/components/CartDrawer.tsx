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

// El generador de QR (lib `qrcode`) se carga sólo cuando se muestra el recibo,
// para no pesar en el bundle inicial de todas las páginas.
const QRCode = dynamic(() => import("@/components/QRCode"), {
  ssr: false,
  loading: () => (
    <div className="h-[148px] w-[148px] animate-pulse rounded-[6px] bg-fill/10" />
  ),
});

function WhatsAppIcon({ className = "h-5 w-5" }: any) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
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
      // El cupón aplicado se conserva (igual que el carrito); sólo limpiamos
      // el mensaje de error para no arrastrar avisos viejos al reabrir.
      setCouponError(null);
      setRender(true);
      document.body.style.overflow = "hidden";
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    setVisible(false);
    document.body.style.overflow = "";
    const t = setTimeout(() => setRender(false), 320);
    return () => clearTimeout(t);
  }, [isOpen]);

  useEffect(() => () => {
    document.body.style.overflow = "";
  }, []);

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
    // Sólo productos con stock que NO estén ya en el carrito.
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

  // Miniaturas para las filas del carrito: el carrito guarda sólo id/nombre/
  // precio, así que la foto se busca en el catálogo ya traído (misma carga que
  // el cross-sell; si no llegó, la fila se ve igual que antes, sin foto).
  const thumbById = useMemo(() => {
    const m = new Map();
    for (const p of catalog) {
      const img = productImages(p).find((u) => !isVideo(u));
      if (img) m.set(p.id, img);
    }
    return m;
  }, [catalog]);

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
        // Cupón inválido/vencido: soltamos el que estuviera aplicado para que
        // el total mostrado nunca prometa un descuento que el server rechazará.
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

      // No abrimos WhatsApp por código (en mobile eso suele caer en la página de
      // descarga). Mostramos la pantalla de éxito con un LINK real que el usuario
      // toca: así el deep-link al chat funciona a la primera.
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
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={closeCart}
      />

      <aside
        className={`absolute inset-x-0 bottom-0 flex max-h-[90vh] transform-gpu flex-col rounded-t-[4px] border-t border-line/10 bg-surface shadow-card transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:inset-y-0 md:bottom-auto md:left-auto md:right-0 md:h-full md:max-h-none md:w-full md:max-w-md md:rounded-t-none md:border-l md:border-t-0 ${
          visible
            ? "translate-y-0 md:translate-x-0"
            : "translate-y-full md:translate-y-0 md:translate-x-full"
        }`}
      >
        <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-fill/15 md:hidden" />

        <div className="flex items-center justify-between border-b border-line/10 px-5 py-4">
          <h2 className="text-base font-semibold text-ink">{t("cart.title")}</h2>
          <button
            onClick={closeCart}
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink-soft transition hover:bg-fill/10 hover:text-ink active:scale-90"
            aria-label="Cerrar carrito"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {success ? (
          <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-8 py-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-500/15 text-accent-300 ring-1 ring-accent-500/30">
              <WhatsAppIcon className="h-7 w-7" />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-ink">
              {t("cart.okTitle")}
            </h3>
            <p className="mt-2 text-sm text-ink-soft">
              {t("cart.okBody", { code: success.code })}
            </p>

            {/* Código QR del recibo: privado, lleva al detalle de la compra. */}
            {success.token && (
              <div className="mt-5 flex flex-col items-center">
                <div className="rounded-[8px] bg-white p-2.5 shadow-soft">
                  <QRCode
                    value={`${
                      typeof window !== "undefined" ? window.location.origin : ""
                    }/recibo/${success.token}`}
                    size={148}
                  />
                </div>
                <p className="mt-2 text-xs text-ink-muted">
                  {t("cart.receipt")}
                </p>
                <a
                  href={`/recibo/${success.token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 text-xs font-medium text-accent-300 underline-offset-2 hover:underline"
                >
                  {t("cart.viewReceipt")}
                </a>
              </div>
            )}

            {/* ¿Cómo pagar? Datos de pago configurados en Ajustes: el cliente
                los ve al instante, sin tener que preguntarlos por chat. */}
            {paymentInfo && (
              <div className="mt-4 w-full rounded-[4px] border border-accent-500/25 bg-accent-500/[0.07] px-4 py-3 text-left">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-accent-300">
                  {t("cart.howPay")}
                </p>
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
                  {paymentInfo}
                </p>
              </div>
            )}

            <a
              href={success.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-accent mt-6 w-full py-3.5 text-[15px]"
            >
              <WhatsAppIcon className="h-5 w-5" /> {t("cart.openWa")}
            </a>
            {/* Alternativa por si el chat no abre (típico en PC): copiar el
                número y escribirnos a mano. */}
            {phone && (
              <div className="mt-3 w-full">
                <p className="text-xs text-ink-muted">
                  {t("cart.copyHint")}
                </p>
                <CopyNumber className="mt-1.5 w-full justify-center" />
              </div>
            )}
            <button onClick={closeCart} className="btn-ghost mt-3 w-full py-3">
              {t("cart.keep")}
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-fill/5 text-ink-muted">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 4h2l2.4 12.3a1 1 0 0 0 1 .7h8.7a1 1 0 0 0 1-.8L21 8H6" />
                <circle cx="9.5" cy="20" r="1.4" />
                <circle cx="17.5" cy="20" r="1.4" />
              </svg>
            </div>
            <p className="mt-4 font-medium text-ink">{t("cart.emptyTitle")}</p>
            <p className="mt-1 text-sm text-ink-muted">
              {t("cart.emptySub")}
            </p>
            <button onClick={closeCart} className="btn-ghost mt-6 px-6 py-2.5">
              {t("cart.seeProducts")}
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <ul className="space-y-3">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex gap-3 rounded-[4px] border border-line/10 p-3"
                  >
                    {thumbById.get(item.id) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumbById.get(item.id)}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-14 w-14 shrink-0 rounded-[4px] border border-line/10 bg-surface-soft object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[4px] border border-line/10 bg-surface-soft text-ink-muted">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <rect x="3" y="5" width="18" height="14" rx="2" />
                          <circle cx="8.5" cy="10" r="1.5" />
                          <path d="M21 16l-5-5L5 19" />
                        </svg>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">
                        {item.name || "Producto"}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {formatPrice(item.price)} {t("cart.each")}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex items-center rounded-[4px] border border-line/15">
                          <button
                            onClick={() => updateQty(item.id, item.quantity - 1)}
                            className="flex h-9 w-9 items-center justify-center text-ink-soft transition hover:text-ink active:scale-90"
                            aria-label="Restar"
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQty(item.id, item.quantity + 1)}
                            className="flex h-9 w-9 items-center justify-center text-ink-soft transition hover:text-ink active:scale-90 disabled:opacity-30"
                            disabled={item.quantity >= (item.stock ?? 99)}
                            aria-label="Sumar"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-xs text-ink-muted underline-offset-2 transition hover:text-ink hover:underline"
                        >
                          {t("cart.remove")}
                        </button>
                      </div>
                    </div>
                    <div className="text-right text-sm font-semibold text-ink">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </li>
                ))}
              </ul>

              {/* Cross-sell: hasta 2 complementos con stock que todavía no están
                  en el carrito (misma categoría primero). Sube el ticket promedio
                  sin estorbar: si no hay sugerencias, no aparece nada. */}
              {suggestions.length > 0 && (
                <div className="mt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                    {t("cart.crossSell")}
                  </p>
                  <ul className="mt-2 space-y-2">
                    {suggestions.map((p) => {
                      const thumb = productImages(p).find((u) => !isVideo(u));
                      return (
                        <li
                          key={p.id}
                          className="flex items-center gap-2.5 rounded-[4px] border border-line/10 p-2.5 text-sm"
                        >
                          {thumb && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={thumb}
                              alt=""
                              loading="lazy"
                              className="h-10 w-10 shrink-0 rounded-[3px] object-cover"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-ink">
                              {p.name || p.category || "Producto"}
                            </p>
                            <p className="mt-0.5 text-xs text-ink-muted">
                              {formatPrice(p.price)}
                            </p>
                          </div>
                          <button
                            onClick={() => addItem(p)}
                            className="shrink-0 rounded-[3px] border border-line/15 px-2.5 py-1.5 text-xs font-medium text-ink-soft transition hover:border-accent-500/50 hover:text-accent-300 active:scale-95"
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
                <div className="mt-4 rounded-[4px] border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-200">
                  <p className="font-medium">{error}</p>
                  {conflicts.length > 0 && (
                    <ul className="mt-1 list-inside list-disc text-xs">
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

              <div className="mt-4 space-y-3">
                <div>
                  <label className="label" htmlFor="cart-name">
                    {t("cart.name")}
                  </label>
                  <input
                    id="cart-name"
                    className="input"
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
                    className="input"
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
                    className="input min-h-[64px] resize-none"
                    placeholder={t("cart.notePh")}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>

              </div>
            </div>

            <div
              className="border-t border-line/10 px-5 pt-4"
              style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
            >
              {/* Cupón SIEMPRE visible (pie fijo, no scrollea): antes vivía al
                  final del formulario y en PC quedaba fuera de vista. */}
              <div className="mb-3">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between gap-3 rounded-[4px] border border-green-500/30 bg-green-500/10 px-3 py-2.5 text-[13px] text-green-300">
                    <span className="min-w-0 truncate">
                      {t("cart.couponOn", { code: appliedCoupon.code, p: appliedCoupon.percent })}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAppliedCoupon(null);
                        setCouponError(null);
                      }}
                      className="shrink-0 text-xs text-ink-muted underline-offset-2 transition hover:text-ink hover:underline"
                    >
                      {t("cart.remove")}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <input
                        className="input flex-1"
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
                        className="btn-ghost shrink-0 px-4 text-[13px]"
                      >
                        {couponLoading ? t("cart.validating") : t("cart.apply")}
                      </button>
                    </div>
                    {couponError && (
                      <p className="mt-1.5 text-xs text-red-400">{couponError}</p>
                    )}
                  </>
                )}
              </div>
              {appliedCoupon ? (
                /* Con cupón: desglose Subtotal → Descuento → Total para que el
                   ahorro se vea explícito (el mismo cálculo que hará el server). */
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink-soft">{t("cart.subtotal")}</span>
                    <span className="font-medium text-ink-soft">
                      {formatPrice(total)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-green-300">
                    <span>{t("cart.discount", { code: appliedCoupon.code })}</span>
                    <span className="font-medium">−{formatPrice(discount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-base">
                    <span className="text-ink-soft">{t("cart.total")}</span>
                    <span className="text-xl font-semibold text-ink">
                      {formatPrice(Math.max(0, total - discount))}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between text-base">
                  <span className="text-ink-soft">{t("cart.total")}</span>
                  <span className="text-xl font-semibold text-ink">
                    {formatPrice(total)}
                  </span>
                </div>
              )}
              <button
                onClick={checkout}
                disabled={loading}
                className="btn-accent mt-3 w-full py-3.5 text-[15px]"
              >
                {loading ? (
                  t("cart.processing")
                ) : (
                  <>
                    <WhatsAppIcon className="h-5 w-5" /> {t("cart.checkout")}
                  </>
                )}
              </button>
              <p className="mt-2 text-center text-xs text-ink-muted">
                {t("cart.willOpen")}
              </p>
              {/* Métodos de pago visibles ANTES de confirmar: menos dudas, más
                  pedidos terminados. */}
              <p className="mt-1.5 flex items-center justify-center gap-3 text-[11px] text-ink-muted">
                <span className="inline-flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="2" y="6" width="20" height="12" rx="2" />
                    <circle cx="12" cy="12" r="2.5" />
                  </svg>
                  {t("cart.cash")}
                </span>
                <span className="inline-flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 10h16M4 10l3-6h10l3 6M6 10v9h12v-9" />
                  </svg>
                  {t("cart.transfer")}
                </span>
                <span className="inline-flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 3 4 6v6c0 5 3.4 8 8 9 4.6-1 8-4 8-9V6z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                  {t("cart.payConfirm")}
                </span>
              </p>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
