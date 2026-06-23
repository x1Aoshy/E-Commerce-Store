import "./globals.css";
import { CartProvider } from "@/context/CartContext";

const STORE = process.env.NEXT_PUBLIC_STORE_NAME || "Aosh Suplementos";

export const metadata = {
  title: `${STORE} — Suplementos premium para tu rendimiento`,
  description:
    "Selección sobria de suplementos de alta pureza. Proteínas, creatina, vitaminas y más. Pedidos simples por WhatsApp.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
