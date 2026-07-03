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
// Ícono social minimalista: cuadradito con borde fino, se enciende al hover.
function SocialIcon({ href, label, children }: any) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className="flex h-9 w-9 items-center justify-center rounded-[4px] border border-line/15 text-ink-soft transition hover:border-accent-500/40 hover:text-accent-300 active:scale-95"
    >
      {children}
    </a>
  );
}

export default function Footer() {
  const { storeName, whatsappNumber, instagramUrl, facebookUrl } = useBranding();
  const { t } = useLang();
  const store = storeName || STORE;
  const phone = (whatsappNumber || "").replace(/[^\d]/g, "") || PHONE;
  const waUrl = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(
        "¡Hola! Tengo una consulta sobre los suplementos."
      )}`
    : "";

  return (
    <footer id="contacto" className="border-t border-line/10 bg-surface/40 text-ink">
      <div className="container-content py-7">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <Logo />
            {/* Redes como íconos minimalistas (se ocultan si no están configuradas). */}
            <div className="mt-4 flex items-center gap-2">
              {waUrl && (
                <SocialIcon href={waUrl} label="WhatsApp">
                  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3z" />
                    <path d="M8.5 9c0 4 2.5 6.5 6.5 6.5" />
                  </svg>
                </SocialIcon>
              )}
              {instagramUrl && (
                <SocialIcon href={instagramUrl} label="Instagram">
                  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.2" cy="6.8" r="0.8" fill="currentColor" stroke="none" />
                  </svg>
                </SocialIcon>
              )}
              {facebookUrl && (
                <SocialIcon href={facebookUrl} label="Facebook">
                  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M14 8h2.5V4.5H14A4.5 4.5 0 0 0 9.5 9v2.5H7V15h2.5v6H13v-6h2.5l.5-3.5h-3V9a1 1 0 0 1 1-1z" />
                  </svg>
                </SocialIcon>
              )}
            </div>
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
