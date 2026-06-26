// Construye el enlace "click to chat" de WhatsApp (wa.me) con el resumen del
// pedido pre-cargado. No requiere credenciales ni API: abre el chat del
// vendedor con el mensaje listo para enviar.

const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY || "C$";

function money(n) {
  return `${CURRENCY}${(Number(n) || 0).toLocaleString("es-AR")}`;
}

export function buildOrderMessage(order, storeName = "Titan Supplements", customMessage = "") {
  const lines = [];
  lines.push(`*Nuevo pedido — ${storeName}*`);
  lines.push(`Código: ${order.code}`);
  lines.push("");
  for (const item of order.items) {
    lines.push(`• ${item.quantity}× ${item.name} — ${money(item.subtotal)}`);
  }
  lines.push("");
  lines.push(`*Total: ${money(order.total)}*`);
  if (order.customer && order.customer.name) {
    lines.push("");
    lines.push(`Nombre: ${order.customer.name}`);
  }
  if (order.customer && order.customer.note) {
    lines.push(`Nota: ${order.customer.note}`);
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

export function buildWhatsAppUrl({ phone, order, storeName, message }) {
  const number = String(phone || "").replace(/[^\d]/g, "");
  const text = encodeURIComponent(buildOrderMessage(order, storeName, message));
  if (!number) {
    // Sin número configurado: abre WhatsApp para elegir contacto igualmente.
    return `https://wa.me/?text=${text}`;
  }
  return `https://wa.me/${number}?text=${text}`;
}
