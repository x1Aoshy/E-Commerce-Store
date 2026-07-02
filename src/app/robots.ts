import type { MetadataRoute } from "next";

// robots.txt automático: la tienda es indexable; el panel, las APIs y los
// recibos privados (QR) quedan FUERA de los buscadores.
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000")
  .trim()
  .replace(/\/+$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/recibo/"],
    },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
