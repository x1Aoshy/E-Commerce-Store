const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY || "C$";

export function formatPrice(value) {
  const n = Number(value) || 0;
  // Separador de miles con coma (ej. C$2,500). Precios en enteros (sin decimales).
  return `${CURRENCY}${Math.round(n).toLocaleString("en-US")}`;
}
