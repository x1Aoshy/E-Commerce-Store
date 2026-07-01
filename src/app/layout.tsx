import "./globals.css";
import { Nunito_Sans, Fraunces, IBM_Plex_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { CartProvider } from "@/context/CartContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { BrandingProvider } from "@/context/BrandingContext";
import { ThemeProvider } from "@/context/ThemeContext";
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
// Mono para los "datos de etiqueta" (números de producto, rótulos de sección,
// métricas): la firma visual de packaging de suplemento.
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-plexmono",
  display: "swap",
});

// Dinámico: leemos el branding en cada request para que el logo/nombre/Icon
// correctos salgan en el primer render (sin parpadeo del default al recargar).
export const dynamic = "force-dynamic";

export const metadata = {
  // Base para URLs absolutas en metadatos (og:image, canonical, etc.).
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: `${STORE} — Suplementos premium para tu rendimiento`,
  description:
    "Proteínas, creatina, pre-entrenos y más, de alta pureza. Elegí tu suplemento y hacé tu pedido en segundos por WhatsApp.",
};

// viewport-fit=cover hace que env(safe-area-inset-*) funcione en iPhones con
// notch (lo usan el Modal, los toasts y el carrito para no quedar tapados).
export const viewport = {
  // El color de la barra del navegador (móvil) se adapta al tema del sistema.
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0c0d" },
    { media: "(prefers-color-scheme: light)", color: "#f6f3eb" },
  ],
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
    <html lang="es" className={`${nunito.variable} ${fraunces.variable} ${plexMono.variable}`}>
      <body>
        {/* Aplica el tema (claro/oscuro) ANTES de pintar, para que no haya
            parpadeo al recargar. Lee la preferencia guardada o la del sistema. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('aosh_theme');var l=t==='light'||(t!=='dark'&&window.matchMedia('(prefers-color-scheme: light)').matches);if(l)document.documentElement.classList.add('light');}catch(e){}})();",
          }}
        />
        <Background />
        <ThemeProvider>
          <BrandingProvider initial={settings}>
            <BrandFavicon />
            <CartProvider>
              <FavoritesProvider>
                <ToastProvider>{children}</ToastProvider>
              </FavoritesProvider>
            </CartProvider>
          </BrandingProvider>
        </ThemeProvider>
        {/* Vercel Analytics: mide visitas y conversión en el panel de Vercel
            sin configuración extra (no hace nada fuera de Vercel). */}
        <Analytics />
      </body>
    </html>
  );
}
