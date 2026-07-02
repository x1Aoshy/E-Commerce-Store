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

// Producto agotado → captura "avisame cuando vuelva": guarda el contacto en la
// lista de suscriptores (con el producto como origen) en vez de perder la venta.
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
      <div className="mt-6 rounded-[4px] border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
        {t("buy.notifyDone")}
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-[4px] border border-line/15 bg-fill/5 px-4 py-3.5">
      <p className="text-sm font-medium text-ink">{t("buy.soldoutTitle")}</p>
      <p className="mt-0.5 text-xs text-ink-muted">
        {t("buy.soldoutSub")}
      </p>
      <form onSubmit={submit} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder={t("buy.notifyPh")}
          aria-label="WhatsApp o email"
          className="input flex-1"
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="btn-accent shrink-0 px-4 py-2.5 text-sm"
        >
          {state === "loading" ? t("buy.notifySending") : t("buy.notifyBtn")}
        </button>
      </form>
      {state === "error" && <p className="mt-2 text-xs text-red-400">{msg}</p>}
    </div>
  );
}

export default function ProductBuyPanel({ product }) {
  const { addItem, openCart } = useCart();
  const { t } = useLang();
  const toast = useToast();
  const { whatsappNumber } = useBranding();
  const phone = (whatsappNumber || "").replace(/[^\d]/g, "");
  const s = stockStatus(product.stock);
  const max = Math.max(1, Number(product.stock) || 1);
  const [qty, setQty] = useState(1);
  const [ordering, setOrdering] = useState(false);
  // Resultado de "Pedir ahora": link real de WhatsApp para tocar (en mobile un
  // window.open caía en la pantalla de descarga; un <a> abre el chat directo).
  const [waUrl, setWaUrl] = useState("");
  const onSale = Number(product.compareAt) > Number(product.price);
  const off = onSale ? Math.round((1 - product.price / product.compareAt) * 100) : 0;
  const lowStock = s.available && Number(product.stock) > 0 && Number(product.stock) <= 5;

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
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">
          {product.category}
        </span>
        <StockBadge stock={product.stock} />
      </div>

      <div className="mt-4 flex flex-wrap items-baseline gap-3">
        <span className="text-3xl font-semibold text-ink">
          {formatPrice(product.price)}
        </span>
        {onSale && (
          <>
            <span className="text-lg text-ink-muted line-through">
              {formatPrice(product.compareAt)}
            </span>
            <span className="rounded-[3px] bg-accent-500 px-1.5 py-0.5 text-xs font-bold text-[#1a1306]">
              -{off}% OFF
            </span>
          </>
        )}
      </div>

      {lowStock && (
        <p className="mt-2 text-sm font-medium text-accent-300">
          {t("buy.low", { n: product.stock })}
        </p>
      )}

      {s.available ? (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-[3px] border border-line/15">
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
            <button onClick={addToCart} className="btn-accent flex-1 py-3.5">
              {t("buy.addToCart")}
            </button>
            <FavoriteButton id={product.id} variant="inline" />
          </div>

          {/* Pedir ahora: compra directa por WhatsApp en un paso. */}
          {waUrl ? (
            <>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setWaUrl("")}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-[3px] border border-green-500 bg-green-500/10 py-3.5 text-sm font-semibold text-green-300 transition hover:bg-green-500/20"
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
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-[3px] border border-green-500 bg-green-500 py-3.5 text-sm font-semibold text-white transition hover:bg-green-400 active:scale-[0.99] disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l-.999 3.648 3.978-1.044zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
              {ordering ? t("buy.preparing") : t("buy.orderNow")}
            </button>
          )}
        </>
      ) : (
        <NotifyMe product={product} />
      )}
    </div>
  );
}
