import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import MobileCartBar from "@/components/MobileCartBar";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import AutoRefresh from "@/components/AutoRefresh";
import ProductGallery from "@/components/ProductGallery";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import ProductBuyPanel from "@/components/product/ProductBuyPanel";
import ProductProfile from "@/components/product/ProductProfile";
import ProductReviews from "@/components/product/ProductReviews";
import { getProductBySlug, getProducts } from "@/lib/db";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

const STORE = process.env.NEXT_PUBLIC_STORE_NAME || "Titan Supplements";
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/+$/, "");

// Primera imagen del producto (si es foto, no video) para OG/schema.
function firstImage(product: any): string {
  const list = Array.isArray(product?.images) ? product.images : [];
  const img = list.find(
    (u: any) => typeof u === "string" && !/\.(mp4|webm|mov)(\?|$)/i.test(u)
  );
  return img || "";
}

export async function generateMetadata({ params }) {
  try {
    const product = await getProductBySlug(params.slug);
    if (product) {
      const title = `${product.name || "Producto"} — ${STORE}`;
      const description =
        product.short || (product.description || "").slice(0, 150);
      const img = firstImage(product);
      return {
        title,
        description,
        // Open Graph: al compartir el link por WhatsApp/redes sale la foto,
        // el nombre y la descripción del producto (clave para vender por chat).
        openGraph: {
          title,
          description,
          type: "website",
          ...(img ? { images: [{ url: img }] } : {}),
        },
        twitter: {
          card: img ? "summary_large_image" : "summary",
          title,
          description,
          ...(img ? { images: [img] } : {}),
        },
      };
    }
  } catch {
    /* ignore */
  }
  return { title: `Producto — ${STORE}` };
}

export default async function ProductPage({ params }) {
  let product: Product | null = null;
  let all: Product[] = [];
  try {
    product = await getProductBySlug(params.slug);
    all = await getProducts();
  } catch (err) {
    console.error("No se pudo cargar el producto:", err);
  }

  if (!product) notFound();

  const related = all
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 3);

  const categories = Array.from(new Set(all.map((p) => p.category)));

  // Datos estructurados (schema.org/Product): Google puede mostrar precio,
  // stock y estrellas directo en los resultados de búsqueda. El JSON se
  // escapa (`<` → <) para que texto malicioso en nombre/descripción no
  // pueda cerrar el <script>.
  const img = firstImage(product);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name || "Producto",
    description: product.short || (product.description || "").slice(0, 300),
    ...(img ? { image: [img] } : {}),
    sku: product.id,
    brand: { "@type": "Brand", name: STORE },
    offers: {
      "@type": "Offer",
      priceCurrency: "NIO",
      price: Number(product.price) || 0,
      availability:
        Number(product.stock) > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      ...(SITE ? { url: `${SITE}/producto/${product.slug}` } : {}),
    },
    ...((product.reviewCount || 0) > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.ratingAvg,
            reviewCount: product.reviewCount,
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <AutoRefresh />
      <Header categories={categories} />
      <main className="container-content py-8 sm:py-12">
        <nav className="text-sm text-ink-muted">
          <Link href="/" className="transition hover:text-ink">
            Inicio
          </Link>
          <span className="px-1.5">/</span>
          <Link href="/#productos" className="transition hover:text-ink">
            Productos
          </Link>
          <span className="px-1.5">/</span>
          <span className="text-ink-soft">{product.name}</span>
        </nav>

        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <Reveal>
            <div className="card aspect-square overflow-hidden bg-surface-soft">
              <ProductGallery product={product} controls fit="contain" />
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div>
              {product.name && (
                <h1 className="text-2xl font-semibold text-ink sm:text-3xl">
                  {product.name}
                </h1>
              )}
              <p className="mt-3 leading-relaxed text-ink-soft">
                {product.description || product.short}
              </p>

              <div className="mt-6">
                <ProductBuyPanel product={product} />
              </div>

              <div className="mt-6">
                <ProductProfile product={product} />
              </div>
            </div>
          </Reveal>
        </div>

        <ProductReviews
          productId={product.id}
          reviews={product.reviews || []}
          ratingAvg={product.ratingAvg || 0}
          reviewCount={product.reviewCount || 0}
        />

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="text-xl font-semibold text-ink">
              También te puede interesar
            </h2>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
              {related.map((p, i) => (
                <Reveal key={p.id} delay={i * 60}>
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
      <CartDrawer />
      <MobileCartBar />
      <WhatsAppFloat />
    </>
  );
}
