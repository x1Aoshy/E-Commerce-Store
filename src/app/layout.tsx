import "./globals.css";
import { Manrope } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { CartProvider } from "@/context/CartContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { BrandingProvider } from "@/context/BrandingContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { ToastProvider } from "@/components/Toast";
import Background from "@/components/Background";
import BrandFavicon from "@/components/BrandFavicon";
import { getSettings } from "@/lib/db";
import { cookies } from "next/headers";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { CURRENCY_COOKIE, normalizeCurrency } from "@/lib/format";

const STORE = process.env.NEXT_PUBLIC_STORE_NAME || "Titan Supplements";

// TIPOGRAFÍA — UNA sola familia.
//
// Antes había tres (Manrope + Anton + JetBrains Mono): nueve archivos que el
// navegador tenía que bajar antes de pintar bien la página. Ahora se carga sólo
// Manrope, que es variable — un archivo cubre de 400 a 800. Los titulares usan
// el peso 800 con interletrado apretado, y las micro-etiquetas usan la mono del
// sistema (cero descargas).
//
// El cambio es de rendimiento Y de tono: la condensada de póster en mayúsculas
// gritaba demasiado. Un grotesco pesado en caja normal se lee como marca seria
// sin taparle la vista al producto, que es lo que se tiene que vender.
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
  adjustFontFallback: false,
});

// Dinámico: leemos el branding en cada request para que el logo/nombre/Icon
// correctos salgan en el primer render (sin parpadeo del default al recargar).
export const dynamic = "force-dynamic";

// Metadatos DINÁMICOS: el favicon sale de Ajustes (el Icon subido) ya desde el
// servidor, así la pestaña nunca muestra el ícono viejo por defecto mientras
// carga. Fallback: /icon-default.svg (en public/, fuera de la convención
// mágica app/icon.svg que lo auto-inyectaba y competía con el subido).
export async function generateMetadata() {
  let iconUrl = "/icon-default.svg";
  try {
    const s = await getSettings();
    iconUrl = s.loginIconUrl || s.logoUrl || iconUrl;
  } catch {
    /* fallback al ícono por defecto */
  }
  return {
    // Base para URLs absolutas en metadatos (og:image, canonical, etc.).
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
    title: `${STORE} — Suplementos premium para tu rendimiento`,
    description:
      "Proteínas, creatina, pre-entrenos y más, de alta pureza. Elegí tu suplemento y hacé tu pedido en segundos por WhatsApp.",
    icons: { icon: iconUrl },
    // Open Graph por defecto (las fichas de producto definen el suyo con foto).
    openGraph: {
      title: `${STORE} — Suplementos premium para tu rendimiento`,
      description:
        "Proteínas, creatina, pre-entrenos y más, de alta pureza. Pedidos por WhatsApp.",
      type: "website",
      locale: "es_NI",
      siteName: STORE,
    },
  };
}

// viewport-fit=cover hace que env(safe-area-inset-*) funcione en iPhones con
// notch (lo usan el Modal, los toasts y el carrito para no quedar tapados).
export const viewport = {
  // El color de la barra del navegador (móvil) se adapta al tema del sistema.
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
    { media: "(prefers-color-scheme: light)", color: "#f4f1ea" },
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
    <html lang="es" className={manrope.variable}>
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
          <LanguageProvider>
            <CurrencyProvider initialCurrency={normalizeCurrency(cookies().get(CURRENCY_COOKIE)?.value)}>
              <BrandingProvider initial={settings}>
                <BrandFavicon />
                <CartProvider>
                  <FavoritesProvider>
                    <ToastProvider>{children}</ToastProvider>
                  </FavoritesProvider>
                </CartProvider>
              </BrandingProvider>
            </CurrencyProvider>
          </LanguageProvider>
        </ThemeProvider>
        {/* Vercel Analytics: mide visitas y conversión en el panel de Vercel
            sin configuración extra (no hace nada fuera de Vercel). */}
        <Analytics />
      </body>
    </html>
  );
}
