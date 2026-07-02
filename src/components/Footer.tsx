"use client";

import Logo from "@/components/Logo";
import NewsletterSignup from "@/components/NewsletterSignup";
import FooterControls from "@/components/FooterControls";
import { useBranding } from "@/context/BrandingContext";
import { useLang } from "@/context/LanguageContext";

const STORE = process.env.NEXT_PUBLIC_STORE_NAME || "Titan Supplements";
const PHONE = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/[^\d]/g, "");

// Footer minimalista: marca + WhatsApp, captura de ofertas, y abajo la letra
// chica con los controles discretos de idioma y tema (fuera del header).
export default function Footer() {
  const { storeName, whatsappNumber } = useBranding();
  const { t } = useLang();
  const store = storeName || STORE;
  const phone = (whatsappNumber || "").replace(/[^\d]/g, "") || PHONE;
  const waUrl = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(
        "¡Hola! Tengo una consulta sobre los suplementos."
      )}`
    : "https://wa.me/";

  return (
    <footer id="contacto" className="border-t border-line/10 bg-surface/40 text-ink">
      <div className="container-content py-7">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <Logo />
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-accent mt-4 px-4 py-2 text-[13px]"
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
              {t("footer.whatsapp")}
            </a>
          </div>

          <NewsletterSignup />
        </div>

        <div className="mt-6 flex flex-col items-start justify-between gap-3 border-t border-line/10 pt-4 sm:flex-row sm:items-center">
          <span className="text-[11px] text-ink-muted">
            © {new Date().getFullYear()} {store} · {t("footer.rights")} ·{" "}
            {t("footer.orders")}
          </span>
          <FooterControls />
        </div>
      </div>
    </footer>
  );
}
