// Construye el enlace "click to chat" de WhatsApp (wa.me) con el resumen del
// pedido pre-cargado. No requiere credenciales ni API: abre el chat del
// vendedor con el mensaje listo para enviar.

import { formatPrice, normalizeCurrency, USD_EXCHANGE_RATE } from "./format";

export function buildOrderMessage(
  order,
  storeName = "Titan Supplements",
  customMessage = "",
  receiptUrl = "",
  currency = "NIO"
) {
  const selectedCurrency = normalizeCurrency(currency);
  const money = (value) => formatPrice(value, selectedCurrency);
  const lines: string[] = [];
  lines.push(`*Nuevo pedido — ${storeName}*`);
  lines.push(`Código: ${order.code}`);
  lines.push(`Moneda: ${selectedCurrency === "USD" ? "Dólares (USD)" : "Córdobas (NIO)"}`);
  if (selectedCurrency === "USD") lines.push(`Tipo de cambio: US$1 = C$${USD_EXCHANGE_RATE}`);
  lines.push("");
  for (const item of order.items) {
    lines.push(`• ${item.quantity}× ${item.name || "Producto"} — ${money(item.subtotal)}`);
  }
  lines.push("");
  // Pedidos anteriores a la migración de cupones no traen discount/coupon:
  // caen a 0 y conservan la línea de total única de siempre.
  const discount = Math.max(0, Number(order.discount) || 0);
  const extra = Math.max(0, Number(order.extra) || 0);
  const grand = Math.max(0, (Number(order.total) || 0) - discount) + extra;
  if (discount > 0 || extra > 0) {
    // Con cupón: desglose para que el total del chat coincida con lo que el
    // cliente vio en el checkout (y quede constancia del código usado).
    lines.push(`Subtotal: ${money(order.total)}`);
    if (discount > 0) lines.push(`Descuento (${order.coupon || "cupón"}): -${money(discount)}`);
    if (extra > 0) lines.push(`${order.extraLabel || "Cargo extra"}: ${money(extra)}`);
    lines.push(`*Total: ${money(grand)}*`);
  } else {
    lines.push(`*Total: ${money(order.total)}*`);
  }
  if (order.customer && order.customer.name) {
    lines.push("");
    lines.push(`Nombre: ${order.customer.name}`);
  }
  if (order.customer && order.customer.phone) {
    // Si no hubo nombre, la línea en blanco separadora todavía no se agregó.
    if (!order.customer.name) lines.push("");
    lines.push(`Tel: ${order.customer.phone}`);
  }
  if (order.customer && order.customer.note) {
    lines.push(`Nota: ${order.customer.note}`);
  }
  if (receiptUrl) {
    lines.push("");
    lines.push(`📄 Recibo: ${receiptUrl}`);
  }
  lines.push("");
  // Cierre configurable desde Ajustes; si no hay, usa el mensaje por defecto.
  lines.push(
    customMessage && customMessage.trim()
      ? customMessage.trim()
      : "¡Quiero confirmar este pedido!"
  );
  return lines.join("\n");
}

export function buildWhatsAppUrl({ phone, order, storeName, message, receiptUrl, currency = "NIO" }) {
  const number = String(phone || "").replace(/[^\d]/g, "");
  const text = encodeURIComponent(
    buildOrderMessage(order, storeName, message, receiptUrl, currency)
  );
  if (!number) {
    // Sin número configurado: abre WhatsApp para elegir contacto igualmente.
    return `https://wa.me/?text=${text}`;
  }
  return `https://wa.me/${number}?text=${text}`;
}
