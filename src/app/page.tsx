import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ValueStrip from "@/components/home/ValueStrip";
import BestSellers from "@/components/home/BestSellers";
import CategoryRail from "@/components/home/CategoryRail";
import OfferBand from "@/components/home/OfferBand";
import ProductGrid from "@/components/ProductGrid";
import BrandFilm from "@/components/home/BrandFilm";
import Testimonials from "@/components/home/Testimonials";
import FAQ from "@/components/home/FAQ";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import MobileCartBar from "@/components/MobileCartBar";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import AutoRefresh from "@/components/AutoRefresh";
import { getProducts } from "@/lib/db";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

/* ==========================================================================
   HOME · el recorrido de venta
   --------------------------------------------------------------------------
   El orden de las secciones NO es estético, es un embudo:

     1. HERO         → capta y promete (el cartel de la tienda).
     2. GARANTÍAS    → desactiva la primera objeción: "¿es confiable?".
     3. MÁS PEDIDOS  → producto real a los pocos segundos. Quien llega decidido
                       compra acá mismo, sin bajar más.
     4. POR OBJETIVO → para el que no sabe qué quiere: lo orienta por meta.
     5. OFERTAS      → urgencia honesta, sólo si hay descuentos de verdad.
     6. CATÁLOGO     → el que quiere ver todo, ve todo, con filtros pegajosos.
     7. REEL         → respiro de marca; convierte producto en aspiración.
     8. RESEÑAS      → prueba social de clientes reales.
     9. FAQ          → últimas dudas antes de escribir por WhatsApp.

   Varias secciones se ocultan solas si no tienen datos reales que mostrar
   (ofertas sin descuentos, reseñas sin reseñas). Preferimos una página más
   corta que una sección rellena con humo.
   ========================================================================== */

export default async function HomePage() {
  // Si la base todavía no está configurada, la tienda se muestra igual (sin
  // productos) en vez de romper la página entera.
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
        <ValueStrip />
        <BestSellers products={products} />
        <CategoryRail products={products} />
        <OfferBand products={products} />
        <ProductGrid products={products} />
        <BrandFilm products={products} />
        <Testimonials products={products} />
        <FAQ />
      </main>
      <Footer />
      <CartDrawer />
      <MobileCartBar />
      <WhatsAppFloat />
    </>
  );
}
