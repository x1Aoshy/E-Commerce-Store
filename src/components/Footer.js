"use client";

import Logo from "@/components/Logo";
import NewsletterSignup from "@/components/NewsletterSignup";
import { useBranding } from "@/context/BrandingContext";

const STORE = process.env.NEXT_PUBLIC_STORE_NAME || "Titan Supplements";
const PHONE = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/[^\d]/g, "");

export default function Footer() {
  const { storeName, whatsappNumber } = useBranding();
  const store = storeName || STORE;
  const phone = (whatsappNumber || "").replace(/[^\d]/g, "") || PHONE;
  const waUrl = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(
        "¡Hola! Tengo una consulta sobre los suplementos."
      )}`
    : "https://wa.me/";

  return (
    <footer
      id="contacto"
      className="border-t border-white/10 bg-surface/40 text-ink"
    >
      <div className="container-content py-8">
        <div className="grid gap-7 md:grid-cols-[1.5fr_1fr_1.2fr]">
          <div>
            <Logo />
            <p className="mt-2.5 max-w-xs text-[13px] leading-relaxed text-ink-muted">
              Suplementos de alta pureza para tu entrenamiento, recuperación y
              salud.
            </p>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-accent mt-3.5 px-4 py-2 text-[13px]"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3z" />
                <path d="M8.5 9c0 4 2.5 6.5 6.5 6.5" />
              </svg>
              Escribinos por WhatsApp
            </a>
          </div>

          <div>
            <h4 className="text-[13px] font-semibold">Tienda</h4>
            <ul className="mt-2.5 space-y-1.5 text-[13px] text-ink-muted">
              <li>
                <a href="/#productos" className="transition hover:text-ink">
                  Productos
                </a>
              </li>
              <li>
                <a href="/#beneficios" className="transition hover:text-ink">
                  Beneficios
                </a>
              </li>
              <li>
                <a href="/admin" className="transition hover:text-ink">
                  Panel de administración
                </a>
              </li>
            </ul>
          </div>

          <NewsletterSignup />
        </div>

        <div className="mt-7 flex flex-col items-start justify-between gap-2 border-t border-white/10 pt-4 text-[11px] text-ink-muted sm:flex-row sm:items-center">
          <span>
            © {new Date().getFullYear()} {store}. Todos los derechos reservados.
          </span>
          <span>Hecho con cuidado · Pedidos por WhatsApp</span>
        </div>
      </div>
    </footer>
  );
}
