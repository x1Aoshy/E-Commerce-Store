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
import { convertPrice } from "@/lib/format";

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
      const description = product.short || (product.description || "").slice(0, 150);
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

/* ==========================================================================
   FICHA DE PRODUCTO
   --------------------------------------------------------------------------
   Todo lo que decide la compra vive en la primera pantalla: foto grande,
   nombre, estrellas, precio y el botón. La descripción, la ficha técnica y
   las reseñas van DEBAJO, para quien necesita más argumentos.

   La galería es sticky en escritorio: al bajar a leer la descripción, la foto
   del producto sigue a la vista. En móvil manda el orden natural y el panel de
   compra reaparece en una barra fija al pie.
   ========================================================================== */

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
    .slice(0, 4);

  const categories = Array.from(new Set(all.map((p) => p.category)));

  // Datos estructurados (schema.org/Product): Google puede mostrar precio,
  // stock y estrellas directo en los resultados. El JSON se escapa (`<` →
  // <) para que texto malicioso en nombre/descripción no cierre el script.
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
      price: Number(convertPrice(product.price, "NIO").toFixed(2)),
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

      <main className="container-content pb-24 pt-6 sm:pb-16 sm:pt-8">
        {/* ----------------------------- Migas ---------------------------- */}
        <nav className="font-mono text-[10px] uppercase tracking-widest2 text-ink-muted">
          <Link href="/" className="transition-colors hover:text-ink">
            Inicio
          </Link>
          <span className="px-2 text-line/30">/</span>
          <Link href="/#productos" className="transition-colors hover:text-ink">
            {product.category}
          </Link>
          <span className="px-2 text-line/30">/</span>
          <span className="text-ink-soft">{product.name}</span>
        </nav>

        {/* --------------------------- Bloque principal ------------------- */}
        <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-14">
          {/* Galería (sticky en escritorio) */}
          <Reveal variant="scale">
            <div className="lg:sticky lg:top-28">
              <div className="aspect-square w-full border border-line/12 bg-surface-soft p-2">
                <ProductGallery
                  product={product}
                  controls
                  fit="contain"
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </div>
          </Reveal>

          {/* Panel de compra */}
          <Reveal variant="right" delay={80}>
            <div>
              {product.name && (
                <h1 className="headline text-3xl text-ink sm:text-4xl lg:text-[2.75rem]">
                  {product.name}
                </h1>
              )}

              {product.short && (
                <p className="mt-4 max-w-prose2 text-[15px] leading-relaxed text-ink-soft">
                  {product.short}
                </p>
              )}

              <div className="mt-7">
                <ProductBuyPanel product={product} />
              </div>

              {/* Descripción larga: debajo del botón, no encima. */}
              {product.description && product.description !== product.short && (
                <div className="mt-10 border-t border-line/12 pt-7">
                  <h2 className="font-mono text-[10px] uppercase tracking-widest2 text-ink-muted">
                    Descripción
                  </h2>
                  <p className="mt-3 max-w-prose2 whitespace-pre-line text-[14.5px] leading-relaxed text-ink-soft">
                    {product.description}
                  </p>
                </div>
              )}

              <div className="mt-8">
                <ProductProfile product={product} />
              </div>
            </div>
          </Reveal>
        </div>

        {/* ---------------------------- Reseñas --------------------------- */}
        <ProductReviews
          productId={product.id}
          reviews={product.reviews || []}
          ratingAvg={product.ratingAvg || 0}
          reviewCount={product.reviewCount || 0}
        />

        {/* --------------------------- Relacionados ----------------------- */}
        {related.length > 0 && (
          <section className="mt-20 border-t border-line/12 pt-14">
            <Reveal>
              <p className="eyebrow">{product.category}</p>
              <h2 className="headline mt-2 text-3xl text-ink sm:text-5xl">
                También te puede interesar
              </h2>
            </Reveal>

            <div className="grid-rules mt-8 grid grid-cols-2 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
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
