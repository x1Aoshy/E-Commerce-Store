// Helpers de medios (imágenes/videos) de producto, usables en server y cliente.

// Devuelve el arreglo de medios de un producto. Soporta `images` (arreglo nuevo)
// y el viejo `image` (string único) por compatibilidad.
export function productImages(product) {
  const arr = Array.isArray(product?.images)
    ? product.images.filter((s) => typeof s === "string" && s.trim())
    : [];
  if (arr.length) return arr;
  if (product?.image) return [product.image];
  return [];
}

// ¿La URL apunta a un video? (para decidir entre <img> y <video>).
export function isVideo(url) {
  return /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(String(url || ""));
}
