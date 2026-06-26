import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { BrandingProvider } from "@/context/BrandingContext";
import { ToastProvider } from "@/components/Toast";
import Background from "@/components/Background";
import BrandFavicon from "@/components/BrandFavicon";
import { getSettings } from "@/lib/db";

const STORE = process.env.NEXT_PUBLIC_STORE_NAME || "Titan Supplements";

// Dinámico: leemos el branding en cada request para que el logo/nombre/Icon
// correctos salgan en el primer render (sin parpadeo del default al recargar).
export const dynamic = "force-dynamic";

export const metadata = {
  title: `${STORE} — Suplementos premium para tu rendimiento`,
  description:
    "Proteínas, creatina, pre-entrenos y más, de alta pureza. Elegí tu suplemento y hacé tu pedido en segundos por WhatsApp.",
};

export default async function RootLayout({ children }) {
  let settings;
  try {
    settings = await getSettings();
  } catch {
    settings = undefined;
  }

  return (
    <html lang="es">
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
