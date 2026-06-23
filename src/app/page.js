import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ProductGrid from "@/components/ProductGrid";
import Benefits from "@/components/Benefits";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import { getProducts } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Si la base aún no está configurada/poblada, mostramos la tienda igual
  // (sin productos) en vez de romper toda la página.
  let products = [];
  try {
    products = await getProducts();
  } catch (err) {
    console.error("No se pudieron cargar los productos:", err);
  }

  return (
    <>
      <Header />
      <main>
        <Hero />
        <ProductGrid products={products} />
        <Benefits />
      </main>
      <Footer />
      <CartDrawer />
    </>
  );
}
