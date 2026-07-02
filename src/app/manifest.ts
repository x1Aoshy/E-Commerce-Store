import type { MetadataRoute } from "next";

// Manifest PWA (se sirve en /manifest.webmanifest): permite "instalar" la
// tienda en el teléfono con ícono y pantalla completa, ideal para clientes
// que recompran cada mes. A PROPÓSITO no agregamos service worker: cachear
// páginas chocaría con la venta en tiempo real (precios/stock siempre frescos).
const STORE = process.env.NEXT_PUBLIC_STORE_NAME || "Titan Supplements";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: STORE,
    short_name: STORE.split(" ")[0] || "Tienda",
    description:
      "Suplementos de alta pureza. Elegí el tuyo y pedí por WhatsApp.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0c0d",
    theme_color: "#0a0c0d",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
