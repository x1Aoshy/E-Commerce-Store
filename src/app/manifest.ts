import type { MetadataRoute } from "next";
import { getSettings } from "@/lib/db";

// Manifest PWA (se sirve en /manifest.webmanifest): permite "instalar" la
// tienda en el teléfono con ícono y pantalla completa. El ícono sale de
// Ajustes (el Icon subido); si no hay, cae al de por defecto. A PROPÓSITO no
// agregamos service worker: cachear páginas chocaría con la venta en tiempo
// real (precios/stock siempre frescos).
export const dynamic = "force-dynamic";

const STORE = process.env.NEXT_PUBLIC_STORE_NAME || "Titan Supplements";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let name = STORE;
  let iconUrl = "/icon-default.svg";
  try {
    const s = await getSettings();
    if (s.storeName) name = s.storeName;
    iconUrl = s.loginIconUrl || s.logoUrl || iconUrl;
  } catch {
    /* defaults */
  }

  return {
    name,
    short_name: name.split(" ")[0] || "Tienda",
    description:
      "Suplementos de alta pureza. Elegí el tuyo y pedí por WhatsApp.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0c0d",
    theme_color: "#0a0c0d",
    icons: [
      // El ícono del negocio primero; el SVG por defecto como respaldo
      // garantizado para la instalación.
      { src: iconUrl, sizes: "any", purpose: "any" },
      {
        src: "/icon-default.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
