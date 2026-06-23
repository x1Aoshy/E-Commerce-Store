import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ProductGrid from "@/components/ProductGrid";
import Benefits from "@/components/Benefits";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import { getProducts } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const products = getProducts();

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
