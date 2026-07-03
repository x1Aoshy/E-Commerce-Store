"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useBranding } from "@/context/BrandingContext";
import { useLang } from "@/context/LanguageContext";
import { formatPrice } from "@/lib/format";
import { productImages, isVideo } from "@/lib/images";

const PHONE = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/[^\d]/g, "");

// Hero protagonizado por los PRODUCTOS: carrusel dinámico con la foto del
// producto flotando (ondulación suave), nombre y precio, tocable para ir a la
// ficha. Si no hay productos con foto, cae al fondo/logo de Ajustes como antes.
export default function Hero({ products = [] }: any) {
  const { heroImages, whatsappNumber } = useBranding();
  const { t } = useLang();
  const images = Array.isArray(heroImages) ? heroImages.filter(Boolean) : [];
  const [current, setCurrent] = useState(0);
  const [pIdx, setPIdx] = useState(0);

  // Link directo a WhatsApp para el botón "Pedir por WhatsApp".
  const phone = (whatsappNumber || "").replace(/[^\d]/g, "") || PHONE;
  const waUrl = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(
        "¡Hola! Quiero hacer un pedido 💪"
      )}`
    : "#productos";

  // Vitrina: productos CON foto y stock (destacados primero), hasta 5. Cada uno
  // guarda su primera foto para el carrusel.
  const showcase = useMemo(() => {
    const withImg = (Array.isArray(products) ? products : [])
      .filter((p: any) => (Number(p?.stock) || 0) > 0)
      .map((p: any) => ({
        p,
        img: productImages(p).find((u: any) => !isVideo(u)) || "",
      }))
      .filter((x: any) => x.img);
    const featured = withImg.filter((x: any) => x.p.featured);
    return (featured.length > 0 ? featured : withImg).slice(0, 5);
  }, [products]);
  const hasShowcase = showcase.length > 0;

  // Carrusel de productos (4.5s) o, si no hay vitrina, del fondo/logo (5s).
  useEffect(() => {
    if (showcase.length < 2) return;
    const id = setInterval(() => setPIdx((i) => (i + 1) % showcase.length), 4500);
    return () => clearInterval(id);
  }, [showcase.length]);

  useEffect(() => {
    if (hasShowcase || images.length < 2) return;
    const id = setInterval(() => setCurrent((c) => (c + 1) % images.length), 5000);
    return () => clearInterval(id);
  }, [hasShowcase, images.length]);

  const active = images.length ? current % images.length : 0;
  const hasImage = images.length > 0;
  const sel = showcase.length ? pIdx % showcase.length : 0;

  // Carrusel de producto reutilizable (desktop derecha / móvil arriba).
  const productCarousel = (compact: boolean) => (
    <div className={`relative flex w-full flex-col items-center ${compact ? "" : "h-full justify-center"}`}>
      {/* Fotos apiladas con crossfade + ondulación (animate-float). */}
      <div className={`relative w-full ${compact ? "h-52" : "h-[min(52vh,420px)] max-w-md"}`}>
        {showcase.map(({ p, img }: any, idx: number) => (
          <Link
            key={p.id}
            href={`/producto/${p.slug}`}
            aria-hidden={idx !== sel}
            tabIndex={idx === sel ? 0 : -1}
            className={`absolute inset-0 transition-opacity duration-700 ease-out ${
              idx === sel ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <div className="h-full w-full animate-float">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img}
                alt={p.name || ""}
                loading={idx === 0 ? "eager" : "lazy"}
                decoding="async"
                className="h-full w-full object-contain [filter:drop-shadow(0_24px_28px_rgba(0,0,0,0.35))]"
              />
            </div>
          </Link>
        ))}
      </div>

      {/* Nombre + precio del producto visible: invita a tocar. */}
      <Link
        href={`/producto/${showcase[sel]?.p.slug}`}
        className="card mt-3 flex max-w-full items-center gap-2.5 px-4 py-2 shadow-soft transition hover:border-accent-500/40"
      >
        <span className="min-w-0 truncate text-sm font-semibold text-ink">
          {showcase[sel]?.p.name || showcase[sel]?.p.category}
        </span>
        <span className="shrink-0 text-sm font-bold text-accent-300">
          {formatPrice(showcase[sel]?.p.price)}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-ink-muted" aria-hidden="true">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </Link>

      {/* Puntos del carrusel. */}
      {showcase.length > 1 && (
        <div className="mt-3 flex gap-1.5">
          {showcase.map((_: any, idx: number) => (
            <button
              key={idx}
              type="button"
              onClick={() => setPIdx(idx)}
              aria-label={`Producto ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                idx === sel ? "w-5 bg-accent-400" : "w-1.5 bg-line/25 hover:bg-line/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <section id="top" className="relative overflow-hidden">
      {/* Fondo/logo de Ajustes: sólo cuando NO hay vitrina de productos. */}
      {!hasShowcase && hasImage && (
        <div className="absolute inset-0 z-0 hidden bg-night sm:block" aria-hidden="true">
          <div className="absolute inset-y-0 right-0 w-1/2">
            {images.map((src, idx) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={src}
                src={src}
                alt=""
                loading={idx === 0 ? "eager" : "lazy"}
                decoding="async"
                className={`absolute inset-0 h-full w-full object-contain object-right transition-opacity duration-[1200ms] ease-out ${
                  idx === active ? "opacity-100" : "opacity-0"
                }`}
              />
            ))}
          </div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgb(var(--c-night))_0%,rgb(var(--c-night))_24%,transparent_58%)]" />
        </div>
      )}

      {/* Vitrina de productos a la derecha (desktop). */}
      {hasShowcase && (
        <div className="absolute inset-y-0 right-0 z-0 hidden w-1/2 items-center px-8 sm:flex lg:px-14">
          {productCarousel(false)}
        </div>
      )}

      <div className="container-content relative z-10 flex min-h-[72vh] flex-col items-center justify-center pb-14 pt-8 text-center sm:min-h-[88vh] sm:items-start sm:pt-16 sm:text-left">
        {/* Arriba en MÓVIL: vitrina de productos (o el logo si no hay). */}
        {hasShowcase ? (
          <div className="mb-5 w-full max-w-sm sm:hidden">{productCarousel(true)}</div>
        ) : (
          hasImage && (
            <div className="relative mb-4 h-44 w-full max-w-xs sm:hidden" aria-hidden="true">
              {images.map((src, idx) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={src}
                  src={src}
                  alt=""
                  loading={idx === 0 ? "eager" : "lazy"}
                  decoding="async"
                  className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-[1200ms] ease-out ${
                    idx === active ? "opacity-100" : "opacity-0"
                  }`}
                />
              ))}
            </div>
          )
        )}

        {/* En desktop, el texto ocupa la mitad izquierda cuando hay vitrina. */}
        <div className={hasShowcase ? "sm:max-w-[46%]" : ""}>
          <span
            className="animate-fade-in text-xs font-semibold uppercase tracking-[0.22em] text-green-400 sm:text-sm"
            style={{ animationFillMode: "both" }}
          >
            {t("hero.eyebrow")}
          </span>
          <h1
            className="mt-3 max-w-2xl animate-fade-in text-[2rem] font-extrabold leading-[1.05] text-ink min-[380px]:text-4xl sm:text-5xl lg:text-6xl"
            style={{ animationDelay: "80ms", animationFillMode: "both" }}
          >
            {t("hero.title1")}
            <br />
            {t("hero.title2")}{" "}
            <span className="relative inline-block text-accent-400">
              {t("hero.title3")}
              {/* Subrayado "a mano": remate cálido, sin gradientes ni glow. */}
              <svg
                className="absolute -bottom-1.5 left-0 h-2 w-full text-accent-500/70 sm:-bottom-2.5 sm:h-3"
                viewBox="0 0 100 10"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path d="M2 8 Q 50 2 98 6" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
              </svg>
            </span>
          </h1>

          <p
            className="mt-6 max-w-xl animate-fade-in text-base leading-relaxed text-ink mx-auto sm:mx-0 sm:text-lg"
            style={{ animationDelay: "160ms", animationFillMode: "both" }}
          >
            {t("hero.sub")}
          </p>

          <div
            className="mt-8 flex flex-wrap items-center justify-center gap-3 animate-fade-in sm:justify-start"
            style={{ animationDelay: "240ms", animationFillMode: "both" }}
          >
            <a href="#productos" className="btn-accent px-6 py-3 text-[15px]">
              {t("hero.ctaProducts")}
            </a>
            <a
              href={waUrl}
              target={phone ? "_blank" : undefined}
              rel={phone ? "noopener noreferrer" : undefined}
              className="btn-ghost px-6 py-3 text-[15px]"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l-.999 3.648 3.978-1.044zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
              {t("hero.ctaWhatsApp")}
            </a>
          </div>

          {/* Línea de confianza compacta. */}
          <div
            className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 animate-fade-in sm:justify-start"
            style={{ animationDelay: "320ms", animationFillMode: "both" }}
          >
            {["hero.trust1", "hero.trust2", "hero.trust3"].map((k) => (
              <span
                key={k}
                className="inline-flex items-center gap-1.5 text-[13px] text-ink-soft"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="text-accent-400" aria-hidden="true">
                  <path d="M5 12l5 5L20 6" />
                </svg>
                {t(k)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
