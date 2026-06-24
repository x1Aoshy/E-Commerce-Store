import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import Background from "@/components/Background";

const STORE = process.env.NEXT_PUBLIC_STORE_NAME || "Titan Supplements";

export const metadata = {
  title: `${STORE} — Suplementos premium para tu rendimiento`,
  description:
    "Proteínas, creatina, pre-entrenos y más, de alta pureza. Elegí tu suplemento y hacé tu pedido en segundos por WhatsApp.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <Background />
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
