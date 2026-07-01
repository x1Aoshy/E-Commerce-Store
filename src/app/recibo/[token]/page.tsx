import Link from "next/link";
import { getOrderByToken, getSettings } from "@/lib/db";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS = {
  pendiente: { label: "Pendiente de confirmación", cls: "bg-amber-400/15 text-amber-300 ring-amber-400/30" },
  confirmada: { label: "Pedido completado", cls: "bg-green-500/15 text-green-300 ring-green-500/30" },
  cancelada: { label: "Pedido cancelado", cls: "bg-red-500/15 text-red-300 ring-red-500/30" },
};

const PAYMENT = { efectivo: "Efectivo", transferencia: "Transferencia" };

export async function generateMetadata({ params }) {
  const order = await getOrderByToken(params.token);
  return { title: order ? `Recibo ${order.code}` : "Recibo no encontrado" };
}

export default async function ReceiptPage({ params }) {
  const order = await getOrderByToken(params.token);
  let settings = null;
  try {
    settings = await getSettings();
  } catch {
    settings = null;
  }
  const store = settings?.storeName || "Titan Supplements";
  const logo = settings?.logoUrl || "";

  if (!order) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5 py-12">
        <div className="card w-full max-w-md p-8 text-center shadow-card">
          <h1 className="text-xl font-semibold text-ink">Recibo no encontrado</h1>
          <p className="mt-2 text-sm text-ink-soft">
            Este enlace no es válido o el pedido ya no existe. Revisá tu código QR.
          </p>
          <Link href="/" className="btn-accent mt-6 inline-flex px-5 py-2.5 text-sm">
            Ir a la tienda
          </Link>
        </div>
      </main>
    );
  }

  const st = STATUS[order.status] || STATUS.pendiente;
  const date = order.createdAt
    ? new Date(order.createdAt).toLocaleString("es-NI", {
        dateStyle: "long",
        timeStyle: "short",
      })
    : "";
  const units = (order.items || []).reduce((s, it) => s + (Number(it.quantity) || 0), 0);
  const grand = (Number(order.total) || 0) + (Number(order.extra) || 0);

  return (
    <main className="min-h-screen px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-lg">
        {/* Encabezado de marca */}
        <div className="mb-5 flex items-center justify-center gap-3">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={store} className="h-10 w-auto max-w-[180px] object-contain" />
          ) : (
            <span className="text-lg font-semibold text-ink">{store}</span>
          )}
        </div>

        <div className="card overflow-hidden shadow-card">
          {/* Cabecera del recibo */}
          <div className="border-b border-line/10 px-6 py-5 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-300">
              Recibo de compra
            </p>
            <p className="mt-1 text-2xl font-bold text-ink">{order.code}</p>
            <p className="mt-1 text-xs text-ink-muted">{date}</p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ring-1 ${st.cls}`}
              >
                {st.label}
              </span>
              {order.status !== "cancelada" && (
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ring-1 ${
                    order.paid
                      ? "bg-green-500/15 text-green-300 ring-green-500/30"
                      : "bg-fill/5 text-ink-muted ring-line/15"
                  }`}
                >
                  {order.paid ? "✓ Pagado" : "Pago pendiente"}
                </span>
              )}
              {/* Pedido despachado: el cliente que escanea su QR ve que ya va en camino. */}
              {order.shipped && order.status !== "cancelada" && (
                <span className="inline-flex rounded-full bg-accent-500/15 px-3 py-1 text-xs font-medium text-accent-300 ring-1 ring-accent-500/30">
                  🚚 En camino
                </span>
              )}
            </div>
          </div>

          {/* Productos */}
          <div className="px-6 py-4">
            <ul className="divide-y divide-line/10">
              {(order.items || []).map((it, i) => (
                <li key={i} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">
                      {it.name || "Producto"}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      {it.quantity} × {formatPrice(it.price)}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-ink">
                    {formatPrice(it.subtotal)}
                  </span>
                </li>
              ))}
            </ul>

            {order.extra > 0 && (
              <div className="flex items-center justify-between border-t border-line/10 pt-3 text-sm">
                <span className="text-ink-soft">{order.extraLabel || "Cargo extra"}</span>
                <span className="font-medium text-ink">{formatPrice(order.extra)}</span>
              </div>
            )}

            <div className="mt-3 flex items-center justify-between border-t border-line/10 pt-3">
              <span className="text-sm text-ink-soft">
                Total · {units} {units === 1 ? "unidad" : "unidades"}
              </span>
              <span className="text-xl font-bold text-ink">{formatPrice(grand)}</span>
            </div>
          </div>

          {/* Detalles */}
          {(order.paymentMethod || order.customer?.name || order.customer?.phone || order.customer?.note) && (
            <div className="space-y-1.5 border-t border-line/10 px-6 py-4 text-sm">
              {order.paymentMethod && (
                <div className="flex justify-between">
                  <span className="text-ink-muted">Pago</span>
                  <span className="text-ink">{PAYMENT[order.paymentMethod] || order.paymentMethod}</span>
                </div>
              )}
              {order.customer?.name && (
                <div className="flex justify-between">
                  <span className="text-ink-muted">A nombre de</span>
                  <span className="text-ink">{order.customer.name}</span>
                </div>
              )}
              {order.customer?.phone && (
                <div className="flex justify-between">
                  <span className="text-ink-muted">Teléfono</span>
                  <span className="text-ink">{order.customer.phone}</span>
                </div>
              )}
              {order.customer?.note && (
                <div className="flex justify-between gap-4">
                  <span className="shrink-0 text-ink-muted">Nota</span>
                  <span className="text-right text-ink">{order.customer.note}</span>
                </div>
              )}
            </div>
          )}

          {/* ¿Cómo pagar? Sólo mientras el pedido siga sin cobrarse. */}
          {!order.paid && order.status !== "cancelada" && settings?.paymentInfo && (
            <div className="border-t border-line/10 px-6 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-accent-300">
                ¿Cómo pagar?
              </p>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
                {settings.paymentInfo}
              </p>
            </div>
          )}

          <div className="border-t border-line/10 bg-fill/[0.03] px-6 py-4 text-center text-[11px] text-ink-muted">
            Guardá este recibo. Es privado y solo se accede con tu código QR.
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="btn-ghost inline-flex px-5 py-2.5 text-sm">
            Ir a la tienda
          </Link>
        </div>
      </div>
    </main>
  );
}
