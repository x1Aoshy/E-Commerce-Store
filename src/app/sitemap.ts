import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/db";

// Sitemap automático (se sirve en /sitemap.xml): la portada + cada producto.
// Google lo usa para descubrir e indexar las fichas. Usa el dominio canónico.
export const dynamic = "force-dynamic";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000")
  .trim()
  .replace(/\/+$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let products: any[] = [];
  try {
    products = await getProducts();
  } catch {
    products = [];
  }

  return [
    {
      url: `${SITE}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...products.map((p) => ({
      url: `${SITE}/producto/${p.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
