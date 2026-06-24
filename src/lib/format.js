const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY || "C$";

export function formatPrice(value) {
  const n = Number(value) || 0;
  return `${CURRENCY}${n.toLocaleString("es-AR")}`;
}
