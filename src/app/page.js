import Header from "@/components/Header";
import Hero from "@/components/Hero";
import TrustStrip from "@/components/TrustStrip";
import Recommended from "@/components/Recommended";
import RecentlyViewed from "@/components/RecentlyViewed";
import ProductGrid from "@/components/ProductGrid";
import Testimonials from "@/components/Testimonials";
import Benefits from "@/components/Benefits";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import MobileCartBar from "@/components/MobileCartBar";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import AutoRefresh from "@/components/AutoRefresh";
import { getProducts, getApprovedReviews } from "@/lib/db";

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

  // Reseñas aprobadas (prueba social). Resiliente: getApprovedReviews nunca lanza.
  const reviews = await getApprovedReviews();

  const categories = Array.from(new Set(products.map((p) => p.category)));

  return (
    <>
      <AutoRefresh />
      <Header categories={categories} />
      <main>
        <Hero />
        <TrustStrip />
        <Recommended products={products} />
        <RecentlyViewed products={products} />
        <ProductGrid products={products} />
        <Testimonials reviews={reviews} />
        <Benefits />
      </main>
      <Footer />
      <CartDrawer />
      <MobileCartBar />
      <WhatsAppFloat />
    </>
  );
}
