import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ProductGrid from "@/components/ProductGrid";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import MobileCartBar from "@/components/MobileCartBar";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import AutoRefresh from "@/components/AutoRefresh";
import { getProducts } from "@/lib/db";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Si la base aún no está configurada/poblada, mostramos la tienda igual
  // (sin productos) en vez de romper toda la página.
  let products: Product[] = [];
  try {
    products = await getProducts();
  } catch (err) {
    console.error("No se pudieron cargar los productos:", err);
  }

  const categories = Array.from(new Set(products.map((p) => p.category)));

  return (
    <>
      <AutoRefresh />
      <Header categories={categories} />
      <main>
        <Hero products={products} />
        <ProductGrid products={products} />
      </main>
      <Footer />
      <CartDrawer />
      <MobileCartBar />
      <WhatsAppFloat />
    </>
  );
}
