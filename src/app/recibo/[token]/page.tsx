import Link from "next/link";
import { getOrderByToken, getSettings } from "@/lib/db";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS = {
  pendiente: { label: "Pendiente de confirmación", cls: "bg-amber-400/15 text-amber-300 ring-amber-400/30" },
  confirmada: { label: "Pedido completado", cls: "bg-green-500/15 text-ok ring-green-500/30" },
  cancelada: { label: "Pedido cancelado", cls: "bg-red-500/15 text-red-300 ring-red-500/30" },
};

const PAYMENT = { efectivo: "Efectivo", transferencia: "Transferencia" };

export async function generateMetadata(props) {
  const params = await props.params;
  const order = await getOrderByToken(params.token);
  return { title: order ? `Recibo ${order.code}` : "Recibo no encontrado" };
}

export default async function ReceiptPage(props) {
  const params = await props.params;
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
  // Cupón: pedidos previos a la migración no traen discount → cae a 0. El
  // total a pagar nunca baja de 0 aunque el descuento supere al subtotal.
  // (cast a any: el tipo Order de db.ts todavía no declara coupon/discount)
  const coupon = String((order as any).coupon || "");
  const discount = Math.max(0, Number((order as any).discount) || 0);
  const grand =
    Math.max(0, (Number(order.total) || 0) - discount) + (Number(order.extra) || 0);

  return (
    <main className="min-h-screen px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-lg">
        {/* Encabezado de marca */}
        <div className="mb-5 flex items-center justify-center gap-3">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={store} className="h-10 w-auto max-w-[180px] object-contain" />
          ) : (
            <span className="headline text-2xl text-ink">{store}</span>
          )}
        </div>

        <div className="card overflow-hidden shadow-card">
          {/* Cabecera del recibo */}
          <div className="border-b border-line/10 px-6 py-5 text-center">
            <p className="eyebrow text-brand">Recibo de compra</p>
            <p className="tnum headline mt-2 text-4xl text-ink">{order.code}</p>
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
                      ? "bg-green-500/15 text-ok ring-green-500/30"
                      : "bg-fill/5 text-ink-muted ring-line/15"
                  }`}
                >
                  {order.paid ? "✓ Pagado" : "Pago pendiente"}
                </span>
              )}
              {/* Pedido despachado: el cliente que escanea su QR ve que ya va en camino. */}
              {order.shipped && order.status !== "cancelada" && (
                <span className="inline-flex rounded-full bg-accent-500/15 px-3 py-1 text-xs font-medium text-brand ring-1 ring-accent-500/30">
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
                    <p className="tnum mt-0.5 text-xs text-ink-muted">
                      {it.quantity} × {formatPrice(it.price)}
                    </p>
                  </div>
                  <span className="tnum shrink-0 text-sm font-semibold text-ink">
                    {formatPrice(it.subtotal)}
                  </span>
                </li>
              ))}
            </ul>

            {/* Descuento por cupón: en verde y con el código, para que el
                cliente vea reflejado el ahorro que se le prometió al comprar. */}
            {discount > 0 && (
              <div className="flex items-center justify-between border-t border-line/10 pt-3 text-sm">
                <span className="text-ink-soft">Descuento ({coupon})</span>
                <span className="font-medium text-ok">
                  −{formatPrice(discount)}
                </span>
              </div>
            )}

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
              <span className="tnum font-display text-3xl leading-none text-ink">{formatPrice(grand)}</span>
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
              <p className="eyebrow text-brand">¿Cómo pagar?</p>
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
