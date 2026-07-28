"use client";

import { useState } from "react";
import StockBadge, { stockStatus } from "@/components/StockBadge";
import FavoriteButton from "@/components/FavoriteButton";
import CopyNumber from "@/components/CopyNumber";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/components/Toast";
import { useBranding } from "@/context/BrandingContext";
import { useLang } from "@/context/LanguageContext";
import { formatPrice } from "@/lib/format";

/* ==========================================================================
   PANEL DE COMPRA
   --------------------------------------------------------------------------
   Orden deliberado, de arriba abajo:
     categoría + stock → estrellas → PRECIO (enorme) → ahorro → urgencia real
     → cantidad + AGREGAR → pedir ya por WhatsApp → garantías.

   Dos caminos de compra a propósito, porque son dos clientes distintos:
   el que arma un pedido grande usa el carrito; el que ya sabe lo que quiere
   toca "Pedir ahora" y cierra por WhatsApp en un paso. Obligar a todos a
   pasar por el carrito pierde a los segundos.
   ========================================================================== */

/* ------------------------- Aviso de reposición ---------------------------- */
// Producto agotado → en vez de perder la venta, capturamos el contacto.
function NotifyMe({ product }: any) {
  const { t } = useLang();
  const [contact, setContact] = useState("");
  const [state, setState] = useState("idle"); // idle | loading | done | error
  const [msg, setMsg] = useState("");

  async function submit(e: any) {
    e.preventDefault();
    const value = contact.trim();
    if (!value) {
      setState("error");
      setMsg("Dejá tu WhatsApp o email.");
      return;
    }
    setState("loading");
    setMsg("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact: value,
          source: `repo:${String(product.name || product.slug || "").slice(0, 24)}`,
        }),
      });
      if (res.ok) {
        setState("done");
      } else {
        const data = await res.json().catch(() => ({}));
        setState("error");
        setMsg(data.error || "No se pudo registrar. Probá de nuevo.");
      }
    } catch {
      setState("error");
      setMsg("Error de conexión. Probá de nuevo.");
    }
  }

  if (state === "done") {
    return (
      <div className="mt-7 border border-green-400/40 bg-green-400/10 px-4 py-4 text-sm font-medium text-green-300">
        {t("buy.notifyDone")}
      </div>
    );
  }

  return (
    <div className="mt-7 border-2 border-line/85 bg-surface p-5 shadow-hard-sm">
      <p className="headline text-xl text-ink">{t("buy.soldoutTitle")}</p>
      <p className="mt-1.5 text-[13px] text-ink-muted">{t("buy.soldoutSub")}</p>
      <form onSubmit={submit} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder={t("buy.notifyPh")}
          aria-label="WhatsApp o email"
          className="input h-12 min-h-0 flex-1 text-sm"
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="btn-accent h-12 min-h-0 shrink-0 px-6 text-[11px]"
        >
          {state === "loading" ? t("buy.notifySending") : t("buy.notifyBtn")}
        </button>
      </form>
      {state === "error" && <p className="mt-2 text-xs text-ember-400">{msg}</p>}
    </div>
  );
}

/* ------------------------------ Estrellas -------------------------------- */
function Stars({ rating = 0, count = 0 }: { rating?: number; count?: number }) {
  if (!count) return null;
  return (
    <a href="#resenas" className="inline-flex items-center gap-2">
      <span className="inline-flex gap-0.5 text-accent-400">
        {Array.from({ length: 5 }).map((_, s) => (
          <svg
            key={s}
            viewBox="0 0 24 24"
            className={`h-4 w-4 ${s < Math.round(rating) ? "" : "text-line/20"}`}
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="m12 2 3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01z" />
          </svg>
        ))}
      </span>
      <span className="tnum text-[12px] text-ink-muted underline-offset-4 hover:underline">
        {rating} · {count} {count === 1 ? "reseña" : "reseñas"}
      </span>
    </a>
  );
}

/* ------------------------------- Panel ----------------------------------- */
export default function ProductBuyPanel({ product }: any) {
  const { addItem, openCart } = useCart();
  const { t } = useLang();
  const toast = useToast();
  const { whatsappNumber } = useBranding();

  const phone = (whatsappNumber || "").replace(/[^\d]/g, "");
  const s = stockStatus(product.stock);
  const max = Math.max(1, Number(product.stock) || 1);

  const [qty, setQty] = useState(1);
  const [ordering, setOrdering] = useState(false);
  // Resultado de "Pedir ahora": link real de WhatsApp para tocar (en móvil un
  // window.open caía en la pantalla de descarga; un <a> abre el chat directo).
  const [waUrl, setWaUrl] = useState("");

  const onSale = Number(product.compareAt) > Number(product.price);
  const off = onSale ? Math.round((1 - product.price / product.compareAt) * 100) : 0;
  const saving = onSale ? Number(product.compareAt) - Number(product.price) : 0;
  const lowStock = s.available && Number(product.stock) > 0 && Number(product.stock) <= 5;
  const lineTotal = Number(product.price) * qty;

  const addToCart = () => {
    addItem(product, qty);
    openCart();
  };

  // Crea un pedido de 1 producto en la base y arma el link de WhatsApp listo
  // para confirmar. Compra directa en un paso, sin pasar por el carrito.
  async function orderNow() {
    setOrdering(true);
    setWaUrl("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ id: product.id, quantity: qty }],
          customer: { name: "", note: "" },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.whatsappUrl) {
        setWaUrl(data.whatsappUrl);
      } else {
        toast.error(data.error || "No se pudo crear el pedido.");
      }
    } catch {
      toast.error("Error de conexión.");
    } finally {
      setOrdering(false);
    }
  }

  return (
    <div>
      {/* --------------------------- Cabecera --------------------------- */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="font-mono text-[10px] uppercase tracking-widest2 text-ink-muted">
          {product.category}
        </span>
        <StockBadge stock={product.stock} />
        <Stars rating={product.ratingAvg} count={product.reviewCount} />
      </div>

      {/* ---------------------------- Precio ---------------------------- */}
      <div className="mt-5 flex flex-wrap items-end gap-x-4 gap-y-2">
        <span className="tnum font-display text-5xl leading-none text-ink sm:text-6xl">
          {formatPrice(product.price)}
        </span>
        {onSale && (
          <>
            <span className="tnum pb-1 text-lg text-ink-muted line-through">
              {formatPrice(product.compareAt)}
            </span>
            <span className="tag mb-1.5 bg-ember-500 px-2.5 py-1 text-[11px] text-white">
              −{off}%
            </span>
          </>
        )}
      </div>

      {onSale && (
        <p className="mt-2 font-mono text-[11px] font-bold uppercase tracking-wider text-ember-400">
          {t("card.save", { amount: formatPrice(saving) })}
        </p>
      )}

      {lowStock && (
        <p className="mt-3 inline-flex items-center gap-2 border border-ember-500/40 bg-ember-500/10 px-3 py-1.5 text-[12.5px] font-bold text-ember-300">
          <span className="h-1.5 w-1.5 rounded-full bg-ember-400" />
          {t("buy.low", { n: product.stock })}
        </p>
      )}

      {s.available ? (
        <>
          {/* ------------------------- Cantidad ------------------------- */}
          <div className="mt-8 flex items-center justify-between border-y border-line/12 py-4">
            <span className="font-mono text-[10px] uppercase tracking-widest2 text-ink-muted">
              {t("buy.qty")}
            </span>
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-line/20">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                  className="flex h-11 w-11 items-center justify-center text-lg text-ink-soft transition-colors hover:bg-fill/5 hover:text-ink disabled:opacity-25"
                  aria-label="Restar"
                >
                  −
                </button>
                <span className="tnum w-10 text-center text-sm font-bold">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(max, q + 1))}
                  disabled={qty >= max}
                  className="flex h-11 w-11 items-center justify-center text-lg text-ink-soft transition-colors hover:bg-fill/5 hover:text-ink disabled:opacity-25"
                  aria-label="Sumar"
                >
                  +
                </button>
              </div>
              {/* Total de la línea: el cliente ve lo que va a pagar ANTES de
                  tocar nada, sin hacer la multiplicación de cabeza. */}
              {qty > 1 && (
                <span className="tnum font-display text-2xl text-accent-300">
                  {formatPrice(lineTotal)}
                </span>
              )}
            </div>
          </div>

          {/* -------------------------- Acciones ------------------------- */}
          <div className="mt-6 flex items-stretch gap-3">
            <button onClick={addToCart} className="btn-accent flex-1 py-4 text-sm">
              {t("buy.addToCart")}
            </button>
            <FavoriteButton id={product.id} variant="inline" />
          </div>

          {/* Compra directa por WhatsApp. */}
          {waUrl ? (
            <>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setWaUrl("")}
                className="btn-wa mt-3 w-full py-4 text-sm"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                  <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l-.999 3.648 3.978-1.044zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
                {t("buy.openConfirm")}
              </a>
              {phone && (
                <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                  {t("buy.notOpen")}
                  <CopyNumber />
                </p>
              )}
            </>
          ) : (
            <button
              onClick={orderNow}
              disabled={ordering}
              className="btn-wa mt-3 w-full py-4 text-sm"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l-.999 3.648 3.978-1.044zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
              {ordering ? t("buy.preparing") : t("buy.orderNow")}
            </button>
          )}

          {/* ------------------------- Garantías ------------------------- */}
          {/* Justo debajo del botón: es donde aparece la última duda. */}
          <ul className="mt-6 space-y-2.5">
            {[t("buy.guarantee"), t("buy.ships"), t("cart.secure")].map((line) => (
              <li key={line} className="flex items-start gap-2.5 text-[12.5px] text-ink-soft">
                <svg
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-400"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12l5 5L20 6" />
                </svg>
                {line}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <NotifyMe product={product} />
      )}
    </div>
  );
}
