// Genera e imprime una factura/recibo estilo POS (ticket ~80mm) para una orden.
// Abre una ventana nueva con el recibo y dispara la impresión del navegador.
// No depende de librerías: arma el HTML y usa window.print().
import { formatPrice, normalizeCurrency, USD_EXCHANGE_RATE } from "./format";

function esc(s) {
  return String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

const STATUS_LABEL = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  cancelada: "Cancelada",
};

const PAYMENT_LABEL = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
};

export function buildInvoiceHtml({
  order,
  storeName = "Titan Supplements",
  currency = "NIO",
  phone = "",
  logoUrl = "",
  qrDataUrl = "",
}) {
  const selectedCurrency = normalizeCurrency(currency);
  const money = (n) => formatPrice(n, selectedCurrency);

  // Marca: si hay logo subido, usamos esa imagen (suele traer el nombre); si no,
  // el escudo por defecto + el nombre de la tienda.
  const brandHtml = logoUrl
    ? `<img class="logo" src="${esc(logoUrl)}" alt="" />`
    : `<svg width="42" height="42" viewBox="0 0 32 32" fill="none">
        <path d="M16 2.5l11 3.8v7.9c0 8-5.2 12.2-11 14.3-5.8-2.1-11-6.3-11-14.3V6.3z" fill="#16382b" stroke="#c79a2b" stroke-width="1.4" stroke-linejoin="round"/>
        <path d="M10 20.5l6-10 6 10" fill="none" stroke="#c79a2b" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12.3 20.5h7.4" stroke="#c79a2b" stroke-width="2.1" stroke-linecap="round"/>
      </svg><div class="name">${esc(storeName || "Titan Supplements")}</div>`;

  let fecha = "";
  try {
    fecha = new Date(order.createdAt).toLocaleString("es-NI", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    fecha = "";
  }

  const rows = (order.items || [])
    .map(
      (it) => `
    <tr>
      <td class="q">${Number(it.quantity) || 0}×</td>
      <td class="n">${esc(it.name || "Producto")}</td>
      <td class="p">${money(it.subtotal)}</td>
    </tr>`
    )
    .join("");

  const extra = Math.max(0, Number(order.extra) || 0);
  // Cupón: pedidos anteriores a la migración no traen discount → cae a 0.
  // El total cobrado nunca baja de 0 aunque el descuento supere al subtotal.
  const discount = Math.max(0, Number(order.discount) || 0);
  const grand = Math.max(0, (Number(order.total) || 0) - discount) + extra;
  const payment = PAYMENT_LABEL[order.paymentMethod] || null;

  const cliente =
    order.customer && order.customer.name
      ? `<div class="row"><span>Cliente</span><span>${esc(
          order.customer.name
        )}</span></div>`
      : "";
  // Teléfono del CLIENTE (distinto de `tel`, que es el WhatsApp de la tienda).
  const telCliente =
    order.customer && order.customer.phone
      ? `<div class="row"><span>Tel</span><span>${esc(
          order.customer.phone
        )}</span></div>`
      : "";
  const vendedor = order.seller
    ? `<div class="row"><span>Atendió</span><span>${esc(order.seller)}</span></div>`
    : "";
  // Desglose de montos: con descuento y/o cargo extra mostramos Subtotal más
  // las líneas que apliquen; sin ninguno, sólo el TOTAL (= order.total), como
  // siempre. El código del cupón pasa por esc(): viene de datos del pedido.
  const discountRow =
    discount > 0
      ? `<div class="srow"><span>Descuento${
          order.coupon ? ` (${esc(order.coupon)})` : ""
        }</span><span>-${money(discount)}</span></div>`
      : "";
  const extraRow =
    extra > 0
      ? `<div class="srow"><span>${esc(
          order.extraLabel || "Cargo extra"
        )}</span><span>${money(extra)}</span></div>`
      : "";
  const desglose =
    discount > 0 || extra > 0
      ? `<div class="srow"><span>Subtotal</span><span>${money(
          order.total
        )}</span></div>
        ${discountRow}
        ${extraRow}`
      : "";
  // Pago siempre visible y prolijo; si no hay método, mostramos "—".
  const pagoRow = `<div class="pago"><span>Pago</span><span>${esc(
    payment || "—"
  )}</span></div>`;
  const nota =
    order.customer && order.customer.note
      ? `<div class="nota">${esc(order.customer.note)}</div>`
      : "";
  const tel = phone ? `<div class="tel">WhatsApp: ${esc(phone)}</div>` : "";
  // QR del recibo privado (si se generó): se escanea para ver el detalle online.
  const qrHtml = qrDataUrl
    ? `<div class="qr"><img src="${esc(qrDataUrl)}" alt="QR del recibo" width="132" height="132"/><div class="qrcap">Escaneá para ver tu recibo</div></div>`
    : "";

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Factura ${esc(order.code || "")}</title>
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #eceeef; }
  .ticket {
    width: 288px; margin: 16px auto; background: #fff; color: #16181a;
    padding: 18px 16px; border-radius: 6px;
    font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace; font-size: 12px;
  }
  .brand { text-align: center; }
  .brand svg { display: block; margin: 0 auto 6px; }
  .brand .logo { display: block; margin: 0 auto 4px; max-width: 220px; max-height: 70px; object-fit: contain; }
  .name { font-weight: 800; letter-spacing: 2px; font-size: 15px; text-transform: uppercase; }
  .doc { text-align: center; font-weight: 700; letter-spacing: 1px; margin: 12px 0 6px; }
  .meta { font-size: 11px; color: #2b2e30; }
  .meta .row { display: flex; justify-content: space-between; gap: 8px; }
  hr { border: none; border-top: 1px dashed #c8ccce; margin: 10px 0; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 2px 0; vertical-align: top; }
  td.q { width: 28px; }
  td.p { text-align: right; white-space: nowrap; padding-left: 6px; }
  .srow { display: flex; justify-content: space-between; font-size: 11px; color: #2b2e30; margin-top: 2px; }
  .total { display: flex; justify-content: space-between; font-weight: 800; font-size: 15px; margin-top: 6px; }
  .pago { display: flex; justify-content: space-between; font-weight: 700; font-size: 12px; margin-top: 2px; }
  .pago span:last-child { text-transform: uppercase; letter-spacing: 1px; }
  .estado { text-align: center; margin-top: 8px; font-size: 11px; color: #2b2e30; }
  .nota { margin-top: 8px; font-size: 11px; background: #f3f4f5; padding: 6px 8px; border-radius: 4px; }
  .tel { text-align: center; margin-top: 6px; font-size: 10px; color: #6b7378; }
  .qr { text-align: center; margin-top: 12px; }
  .qr img { width: 132px; height: 132px; image-rendering: pixelated; }
  .qrcap { font-size: 10px; color: #6b7378; margin-top: 3px; }
  .gracias { text-align: center; margin-top: 12px; font-weight: 700; }
  @media print {
    html, body { background: #fff; }
    .ticket { width: 80mm; margin: 0; padding: 6mm 5mm; border-radius: 0; }
    @page { size: 80mm auto; margin: 0; }
  }
</style></head>
<body>
  <div class="ticket">
    <div class="brand">
      ${brandHtml}
    </div>

    <div class="doc">FACTURA / RECIBO</div>
    <div class="meta">
      <div class="row"><span>Código</span><span>${esc(order.code || "")}</span></div>
      <div class="row"><span>Fecha</span><span>${esc(fecha)}</span></div>
      <div class="row"><span>Moneda</span><span>${selectedCurrency === "USD" ? "Dólares (USD)" : "Córdobas (NIO)"}</span></div>
      ${selectedCurrency === "USD" ? `<div class="row"><span>Tipo de cambio</span><span>US$1 = C$${USD_EXCHANGE_RATE}</span></div>` : ""}
      ${cliente}
      ${telCliente}
      ${vendedor}
    </div>

    <hr/>
    <table>${rows}</table>
    <hr/>

    ${desglose}
    <div class="total"><span>TOTAL</span><span>${money(grand)}</span></div>
    <hr/>
    ${pagoRow}
    <div class="estado">Estado: ${esc(STATUS_LABEL[order.status] || order.status || "")}</div>
    ${nota}
    ${tel}
    ${qrHtml}
    <div class="gracias">¡Gracias por tu compra!</div>
  </div>
</body></html>`;
}

export function printInvoice(args) {
  if (typeof window === "undefined") return;
  const html = buildInvoiceHtml(args);
  const win = window.open("", "_blank", "width=420,height=640");
  if (!win) {
    alert("Permití las ventanas emergentes para imprimir la factura.");
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  // Imprime cuando la ventana terminó de cargar (incluye el logo), con un
  // fallback por si el evento no dispara.
  let printed = false;
  const doPrint = () => {
    if (printed) return;
    printed = true;
    try {
      win.print();
    } catch {
      /* el usuario puede imprimir manualmente */
    }
  };
  win.onload = doPrint;
  setTimeout(doPrint, 700);
}
