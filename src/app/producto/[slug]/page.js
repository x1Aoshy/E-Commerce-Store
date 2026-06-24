import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import MobileCartBar from "@/components/MobileCartBar";
import ProductImage from "@/components/ProductImage";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import ProductBuyPanel from "@/components/product/ProductBuyPanel";
import ProductProfile from "@/components/product/ProductProfile";
import { getProductBySlug, getProducts } from "@/lib/db";

export const dynamic = "force-dynamic";

const STORE = process.env.NEXT_PUBLIC_STORE_NAME || "Titan Supplements";

export async function generateMetadata({ params }) {
  try {
    const product = await getProductBySlug(params.slug);
    if (product) {
      return {
        title: `${product.name} — ${STORE}`,
        description: product.short || (product.description || "").slice(0, 150),
      };
    }
  } catch {
    /* ignore */
  }
  return { title: `Producto — ${STORE}` };
}

export default async function ProductPage({ params }) {
  let product = null;
  let all = [];
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

  return (
    <>
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
            <div className="card overflow-hidden">
              <ProductImage product={product} className="aspect-square w-full" />
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div>
              <h1 className="text-2xl font-semibold text-ink sm:text-3xl">
                {product.name}
              </h1>
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

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="text-xl font-semibold text-ink">
              También te puede interesar
            </h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
    </>
  );
}
