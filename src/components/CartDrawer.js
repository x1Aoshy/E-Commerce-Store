"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/format";

function WhatsAppIcon({ className = "h-5 w-5" }) {
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
  const { items, isOpen, closeCart, updateQty, removeItem, total, clear } =
    useCart();
  const router = useRouter();

  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [success, setSuccess] = useState(null);

  // render = está montado (para permitir la animación de salida)
  // visible = está en posición abierta (dispara la transición)
  const [render, setRender] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setConflicts([]);
      setSuccess(null);
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

  // Garantiza restaurar el scroll del body si el componente se desmonta abierto.
  useEffect(() => () => {
    document.body.style.overflow = "";
  }, []);

  if (!render) return null;

  async function checkout() {
    if (items.length === 0) return;
    setLoading(true);
    setError(null);
    setConflicts([]);

    // Reservamos la pestaña dentro del gesto del usuario para evitar el bloqueo
    // de pop-ups, y luego la apuntamos al enlace de WhatsApp.
    const waWindow = window.open("", "_blank");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ id: i.id, quantity: i.quantity })),
          customer: { name, note },
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (waWindow) waWindow.close();
        setError(data.error || "No se pudo procesar el pedido.");
        setConflicts(data.conflicts || []);
        setLoading(false);
        return;
      }

      if (waWindow) waWindow.location.href = data.whatsappUrl;
      else window.location.href = data.whatsappUrl;

      setSuccess({ code: data.order.code, whatsappUrl: data.whatsappUrl });
      clear();
      setName("");
      setNote("");
      router.refresh();
    } catch {
      if (waWindow) waWindow.close();
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div
        className={`absolute inset-0 bg-ink/40 backdrop-blur-sm transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={closeCart}
      />

      <aside
        className={`absolute inset-x-0 bottom-0 flex max-h-[90vh] transform-gpu flex-col rounded-t-2xl bg-white shadow-card transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:inset-y-0 md:bottom-auto md:left-auto md:right-0 md:h-full md:max-h-none md:w-full md:max-w-md md:rounded-t-none ${
          visible
            ? "translate-y-0 md:translate-x-0"
            : "translate-y-full md:translate-y-0 md:translate-x-full"
        }`}
      >
        <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-ink/15 md:hidden" />

        <div className="flex items-center justify-between border-b border-ink/[0.07] px-5 py-4">
          <h2 className="text-base font-semibold text-ink">Tu pedido</h2>
          <button
            onClick={closeCart}
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink-soft transition hover:bg-ink/5 hover:text-ink active:scale-90"
            aria-label="Cerrar carrito"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {success ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 py-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-50 text-accent-600 ring-1 ring-accent-200">
              <WhatsAppIcon className="h-7 w-7" />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-ink">
              ¡Pedido registrado!
            </h3>
            <p className="mt-2 text-sm text-ink-soft">
              Tu pedido <span className="font-medium text-ink">{success.code}</span>{" "}
              quedó reservado y el stock fue actualizado. Se abrió WhatsApp para
              que lo confirmes con nosotros.
            </p>
            <a
              href={success.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-accent mt-6 w-full py-3"
            >
              <WhatsAppIcon className="h-4 w-4" /> Abrir WhatsApp de nuevo
            </a>
            <button onClick={closeCart} className="btn-ghost mt-3 w-full py-3">
              Seguir comprando
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ink/5 text-ink-muted">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 4h2l2.4 12.3a1 1 0 0 0 1 .7h8.7a1 1 0 0 0 1-.8L21 8H6" />
                <circle cx="9.5" cy="20" r="1.4" />
                <circle cx="17.5" cy="20" r="1.4" />
              </svg>
            </div>
            <p className="mt-4 font-medium text-ink">Tu carrito está vacío</p>
            <p className="mt-1 text-sm text-ink-muted">
              Agregá productos para hacer tu pedido.
            </p>
            <button onClick={closeCart} className="btn-ghost mt-6 px-6 py-2.5">
              Ver productos
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <ul className="space-y-3">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex gap-3 rounded-xl border border-ink/[0.07] p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">
                        {item.name}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {formatPrice(item.price)} c/u
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex items-center rounded-lg border border-ink/15">
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
                          Quitar
                        </button>
                      </div>
                    </div>
                    <div className="text-right text-sm font-semibold text-ink">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </li>
                ))}
              </ul>

              {error && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
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
                    Nombre (opcional)
                  </label>
                  <input
                    id="cart-name"
                    className="input"
                    placeholder="¿A nombre de quién es el pedido?"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="cart-note">
                    Nota (opcional)
                  </label>
                  <textarea
                    id="cart-note"
                    className="input min-h-[64px] resize-none"
                    placeholder="Dirección, horario, aclaraciones..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div
              className="border-t border-ink/[0.07] px-5 pt-4"
              style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
            >
              <div className="flex items-center justify-between text-base">
                <span className="text-ink-soft">Total</span>
                <span className="text-xl font-semibold text-ink">
                  {formatPrice(total)}
                </span>
              </div>
              <button
                onClick={checkout}
                disabled={loading}
                className="btn-accent mt-3 w-full py-3.5 text-[15px]"
              >
                {loading ? (
                  "Procesando..."
                ) : (
                  <>
                    <WhatsAppIcon className="h-5 w-5" /> Finalizar pedido por
                    WhatsApp
                  </>
                )}
              </button>
              <p className="mt-2 text-center text-xs text-ink-muted">
                Se abrirá WhatsApp con el resumen de tu pedido listo para enviar.
              </p>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
