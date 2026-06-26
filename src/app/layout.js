import "./globals.css";
import { Nunito_Sans, Fraunces } from "next/font/google";
import { CartProvider } from "@/context/CartContext";
import { BrandingProvider } from "@/context/BrandingContext";
import { ToastProvider } from "@/components/Toast";
import Background from "@/components/Background";
import BrandFavicon from "@/components/BrandFavicon";
import { getSettings } from "@/lib/db";

const STORE = process.env.NEXT_PUBLIC_STORE_NAME || "Titan Supplements";

// Tipografía: Fraunces (serif suave y natural) para los títulos; Nunito Sans
// (sans humanista cálido) para el texto. Se cargan optimizadas como variables.
const nunito = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-nunito",
  display: "swap",
  adjustFontFallback: false,
});
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-fraunces",
  display: "swap",
});

// Dinámico: leemos el branding en cada request para que el logo/nombre/Icon
// correctos salgan en el primer render (sin parpadeo del default al recargar).
export const dynamic = "force-dynamic";

export const metadata = {
  title: `${STORE} — Suplementos premium para tu rendimiento`,
  description:
    "Proteínas, creatina, pre-entrenos y más, de alta pureza. Elegí tu suplemento y hacé tu pedido en segundos por WhatsApp.",
};

// viewport-fit=cover hace que env(safe-area-inset-*) funcione en iPhones con
// notch (lo usan el Modal, los toasts y el carrito para no quedar tapados).
export const viewport = {
  themeColor: "#0a0c0d",
  viewportFit: "cover",
};

export default async function RootLayout({ children }) {
  let settings;
  try {
    settings = await getSettings();
  } catch {
    settings = undefined;
  }

  return (
    <html lang="es" className={`${nunito.variable} ${fraunces.variable}`}>
      <body>
        <Background />
        <BrandingProvider initial={settings}>
          <BrandFavicon />
          <CartProvider>
            <ToastProvider>{children}</ToastProvider>
          </CartProvider>
        </BrandingProvider>
      </body>
    </html>
  );
}
