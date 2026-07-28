"use client";

import Link from "next/link";
import Logo from "@/components/Logo";
import NewsletterSignup from "@/components/NewsletterSignup";
import FooterControls from "@/components/FooterControls";
import Marquee from "@/components/motion/Marquee";
import { useBranding } from "@/context/BrandingContext";
import { useLang } from "@/context/LanguageContext";

const STORE = process.env.NEXT_PUBLIC_STORE_NAME || "Titan Supplements";
const PHONE = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/[^\d]/g, "");

/* ==========================================================================
   PIE DE PÁGINA
   --------------------------------------------------------------------------
   Un footer de tienda real no es una línea de copyright: es la última
   oportunidad de captura. Por eso arriba va una banda con el nombre de la
   marca corriendo (cierra la página con carácter) y debajo tres columnas:
   captura de contacto, navegación útil y datos de contacto directo.
   ========================================================================== */

function SocialIcon({ href, label, children }: any) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className="flex h-10 w-10 items-center justify-center border border-line/20 text-ink-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-400 hover:bg-accent-400 hover:text-[#17130a]"
    >
      {children}
    </a>
  );
}

function FooterLink({ href, children }: any) {
  return (
    <li>
      <Link
        href={href}
        className="link-underline text-[13px] text-ink-soft transition-colors hover:text-ink"
      >
        {children}
      </Link>
    </li>
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

  // Número legible: "+505 8888 8888" en vez de un bloque de dígitos.
  const prettyPhone = phone
    ? `+${phone.slice(0, 3)} ${phone.slice(3, 7)} ${phone.slice(7)}`.trim()
    : "";

  return (
    <footer id="contacto" className="mt-4 border-t border-line/12 bg-surface/25">
      {/* ================= BANDA DE MARCA (nombre en movimiento) ============ */}
      <div className="border-b border-line/10 py-5">
        <Marquee speed={44} itemClassName="px-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <span
              key={i}
              className="headline text-4xl text-outline sm:text-6xl"
              aria-hidden={i > 0}
            >
              {store}
            </span>
          ))}
        </Marquee>
      </div>

      <div className="container-content py-12 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
          {/* --------------------------- Marca --------------------------- */}
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-ink-muted">
              {t("footer.tagline")}
            </p>
            <div className="mt-5 flex items-center gap-2">
              {waUrl && (
                <SocialIcon href={waUrl} label="WhatsApp">
                  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3z" />
                    <path d="M8.5 9c0 4 2.5 6.5 6.5 6.5" />
                  </svg>
                </SocialIcon>
              )}
              {instagramUrl && (
                <SocialIcon href={instagramUrl} label="Instagram">
                  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.2" cy="6.8" r="0.8" fill="currentColor" stroke="none" />
                  </svg>
                </SocialIcon>
              )}
              {facebookUrl && (
                <SocialIcon href={facebookUrl} label="Facebook">
                  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M14 8h2.5V4.5H14A4.5 4.5 0 0 0 9.5 9v2.5H7V15h2.5v6H13v-6h2.5l.5-3.5h-3V9a1 1 0 0 1 1-1z" />
                  </svg>
                </SocialIcon>
              )}
            </div>
          </div>

          {/* -------------------------- Navegación ------------------------ */}
          <nav>
            <h4 className="font-mono text-[10px] uppercase tracking-widest2 text-ink-muted">
              {t("footer.shop")}
            </h4>
            <ul className="mt-4 space-y-2.5">
              <FooterLink href="/#productos">{t("footer.allProducts")}</FooterLink>
              <FooterLink href="/#productos">{t("footer.deals")}</FooterLink>
              <FooterLink href="/#top">{t("hero.ctaProducts")}</FooterLink>
            </ul>
          </nav>

          <nav>
            <h4 className="font-mono text-[10px] uppercase tracking-widest2 text-ink-muted">
              {t("footer.help")}
            </h4>
            <ul className="mt-4 space-y-2.5">
              <FooterLink href="/#faq">{t("footer.faq")}</FooterLink>
              {waUrl && (
                <li>
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-underline text-[13px] text-ink-soft transition-colors hover:text-ink"
                  >
                    {t("footer.whatsapp")}
                  </a>
                </li>
              )}
              {prettyPhone && (
                <li className="tnum font-mono text-[13px] text-ink-soft">{prettyPhone}</li>
              )}
            </ul>
          </nav>

          {/* ------------------------ Captura de contacto ------------------ */}
          <NewsletterSignup />
        </div>

        {/* ----------------------------- Letra chica ---------------------- */}
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-line/12 pt-6 sm:flex-row sm:items-center">
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
