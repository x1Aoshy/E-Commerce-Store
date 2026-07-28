"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useBranding } from "@/context/BrandingContext";
import { useLang } from "@/context/LanguageContext";
import { formatPrice } from "@/lib/format";
import { productImages, isVideo } from "@/lib/images";
import SmartImage from "@/components/SmartImage";
import Headline from "@/components/motion/Headline";
import CountUp from "@/components/motion/CountUp";

const PHONE = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/[^\d]/g, "");

/* ==========================================================================
   HERO · el cartel de la tienda
   --------------------------------------------------------------------------
   Estructura de portada de revista deportiva: a la izquierda el mensaje (con
   el titular armándose palabra a palabra), a la derecha el PRODUCTO montado
   como pieza de estudio — marco con esquinas, línea de escaneo y peana.
   Nunca hay "espacio decorativo": cada zona vende algo o guía al siguiente paso.

   VIDEO: si el dueño sube un .mp4/.webm a las imágenes del hero (Ajustes), se
   reproduce como fondo cinematográfico en bucle, silenciado y sin controles.
   Si no hay video, el fondo lo ponen la foto con zoom lento (ken burns) y las
   capas de luz — se siente metraje sin pesar un solo byte de más.
   ========================================================================== */

export default function Hero({ products = [] }: any) {
  const { heroImages, heroShowcase, whatsappNumber } = useBranding();
  const { t } = useLang();

  const media = Array.isArray(heroImages) ? heroImages.filter(Boolean) : [];
  const heroVideo = useMemo(() => media.find((u: string) => isVideo(u)) || "", [media]);
  const heroPhotos = useMemo(() => media.filter((u: string) => !isVideo(u)), [media]);

  const [photoIdx, setPhotoIdx] = useState(0);
  const [pIdx, setPIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const phone = (whatsappNumber || "").replace(/[^\d]/g, "") || PHONE;
  const waUrl = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent("¡Hola! Quiero hacer un pedido 💪")}`
    : "#productos";

  /* ---- Vitrina: lista curada desde Ajustes o selección automática ---- */
  const showcase = useMemo(() => {
    const list = Array.isArray(products) ? products : [];
    const firstPhoto = (p: any) => productImages(p).find((u: any) => !isVideo(u)) || "";

    const curated = (Array.isArray(heroShowcase) ? heroShowcase : [])
      .map(({ id, image }: any) => {
        const p = list.find((x: any) => x.id === id);
        if (!p || (Number(p.stock) || 0) <= 0) return null;
        const img = image && !isVideo(image) ? image : firstPhoto(p);
        return img ? { p, img } : null;
      })
      .filter(Boolean);
    if (curated.length > 0) return curated.slice(0, 8);

    const withImg = list
      .filter((p: any) => (Number(p?.stock) || 0) > 0)
      .map((p: any) => ({ p, img: firstPhoto(p) }))
      .filter((x: any) => x.img);
    const featured = withImg.filter((x: any) => x.p.featured);
    return (featured.length > 0 ? featured : withImg).slice(0, 6);
  }, [products, heroShowcase]);

  const hasShowcase = showcase.length > 0;
  const sel = showcase.length ? pIdx % showcase.length : 0;
  const activeProduct = showcase[sel]?.p;

  /* ---- Rotación de la vitrina (se detiene con el puntero encima y con la
         pestaña oculta: cero trabajo de fondo). ---- */
  useEffect(() => {
    if (showcase.length < 2 || paused) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") {
        setPIdx((i) => (i + 1) % showcase.length);
      }
    }, 4200);
    return () => clearInterval(id);
  }, [showcase.length, paused]);

  /* ---- Rotación del fondo fotográfico (sólo si no hay video). ---- */
  useEffect(() => {
    if (heroVideo || heroPhotos.length < 2) return;
    const id = setInterval(() => setPhotoIdx((c) => (c + 1) % heroPhotos.length), 6500);
    return () => clearInterval(id);
  }, [heroVideo, heroPhotos.length]);

  /* ---- El video de fondo se pausa con la pestaña oculta (batería/datos). --- */
  useEffect(() => {
    if (!heroVideo) return;
    const onVis = () => {
      const v = videoRef.current;
      if (!v) return;
      if (document.visibilityState === "visible") v.play().catch(() => {});
      else v.pause();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [heroVideo]);

  /* ---- Cifras de confianza: TODAS calculadas del catálogo real ----------
     Nada de "+1.200 clientes felices" inventado. Se muestra lo que la tienda
     puede demostrar: cuántos productos tiene disponibles ahora mismo y el
     promedio real de las reseñas aprobadas. Si todavía no hay reseñas, esa
     cifra simplemente no aparece — el bloque se adapta. El plazo de entrega
     es la política de la tienda (la misma que declara en las FAQ). */
  const stats = useMemo(() => {
    const list = Array.isArray(products) ? products : [];
    const inStock = list.filter((p: any) => (Number(p?.stock) || 0) > 0).length;

    const withReviews = list.filter((p: any) => (p?.reviewCount || 0) > 0);
    const totalReviews = withReviews.reduce(
      (s: number, p: any) => s + (p.reviewCount || 0),
      0
    );
    const avg = totalReviews
      ? withReviews.reduce(
          (s: number, p: any) => s + (p.ratingAvg || 0) * (p.reviewCount || 0),
          0
        ) / totalReviews
      : 0;

    const out: any[] = [];
    if (inStock > 0) out.push({ n: inStock, suffix: "", label: t("hero.stat1") });
    if (totalReviews > 0) {
      out.push({
        n: avg,
        decimals: 1,
        suffix: "/5",
        label: t("hero.stat2", { n: totalReviews }),
      });
    }
    out.push({ n: 24, suffix: "h", label: t("hero.stat3") });
    return out.slice(0, 3);
  }, [products, t]);

  return (
    <section id="top" className="relative isolate overflow-hidden border-b border-line/10">
      {/* =================== CAPA CINEMATOGRÁFICA DE FONDO =================== */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        {heroVideo ? (
          <video
            ref={videoRef}
            src={heroVideo}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={heroPhotos[0] || undefined}
            className="h-full w-full scale-105 object-cover opacity-45"
          />
        ) : (
          heroPhotos.map((src: string, idx: number) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={src}
              alt=""
              loading={idx === 0 ? "eager" : "lazy"}
              decoding="async"
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1600ms] ease-out ${
                idx === photoIdx ? "opacity-30" : "opacity-0"
              }`}
            />
          ))
        )}

        {/* Cortina: el texto SIEMPRE legible sobre cualquier metraje. */}
        <div className="absolute inset-0 bg-gradient-to-r from-night via-night/88 to-night/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-night via-transparent to-night/70" />
      </div>

      <div className="container-content relative grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-8 lg:py-24">
        {/* ============================== MENSAJE ============================= */}
        <div className="order-2 text-center lg:order-1 lg:text-left">
          {/* Sin insignia de "atendiendo pedidos ahora": era un adorno que
              simulaba actividad en vivo sin medir nada real. Esa clase de señal
              inventada es justo lo que hace que una tienda huela a plantilla.
              El mensaje de disponibilidad ya lo dan el stock de cada producto y
              el botón de WhatsApp, que sí responden a la realidad. */}

          {/* Titular: entra palabra por palabra al cargar. */}
          <h1 className="headline text-4xl text-ink min-[400px]:text-5xl sm:text-6xl lg:text-[4.25rem] xl:text-[4.75rem]">
            <Headline text={t("hero.title1")} className="block" />
            <Headline text={t("hero.title2")} className="block" delay={140} />
            <span className="relative block">
              <Headline
                text={t("hero.title3")}
                className="block text-brand"
                delay={280}
              />
              {/* Remate a mano: un trazo, no un subrayado de plantilla. */}
              <svg
                className="pointer-events-none absolute -bottom-1 left-0 h-4 w-[min(100%,9ch)] text-brand/60 sm:h-6"
                viewBox="0 0 100 10"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M1 7 Q 30 1 55 5 T 99 4"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>

          <p
            className="mx-auto mt-7 max-w-md animate-fade-in text-[15px] leading-relaxed text-ink-soft sm:text-lg lg:mx-0"
            style={{ animationDelay: "560ms", animationFillMode: "both" }}
          >
            {t("hero.sub")}
          </p>

          {/* Acciones: una primaria (catálogo) y una de contacto directo. */}
          <div
            className="mt-8 flex animate-fade-in flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start"
            style={{ animationDelay: "680ms", animationFillMode: "both" }}
          >
            <a href="#productos" className="btn-accent px-8 py-4 text-sm">
              {t("hero.ctaProducts")}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>
            <a
              href={waUrl}
              target={phone ? "_blank" : undefined}
              rel={phone ? "noopener noreferrer" : undefined}
              className="btn-ghost px-8 py-4 text-sm"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l-.999 3.648 3.978-1.044zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
              {t("hero.ctaWhatsApp")}
            </a>
          </div>

          {/* Prueba social medible: tres cifras que suben al entrar en pantalla.
              Números concretos > adjetivos. */}
          <dl
            className="mt-10 grid animate-fade-in gap-px border border-line/12 bg-line/12"
            style={{
              animationDelay: "800ms",
              animationFillMode: "both",
              // Columnas según cuántas cifras REALES hay (2 o 3): con clases
              // dinámicas de Tailwind el JIT no las generaría.
              gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))`,
            }}
          >
            {stats.map((s) => (
              <div key={s.label} className="bg-night px-3 py-4 text-center lg:text-left lg:px-5">
                <dt className="sr-only">{s.label}</dt>
                <dd className="headline text-2xl text-ink sm:text-3xl">
                  <CountUp to={s.n} suffix={s.suffix} decimals={s.decimals || 0} />
                </dd>
                <dd className="mt-1.5 font-mono text-[9.5px] uppercase leading-tight tracking-widest2 text-ink-muted sm:text-[10px]">
                  {s.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* ============================ LA PIEZA ============================= */}
        {hasShowcase && (
          <div
            className="order-1 lg:order-2"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <div className="relative mx-auto w-full max-w-[430px]">
              {/* Marco de estudio: esquinas troqueladas en oro. */}
              <div className="pointer-events-none absolute -inset-3 sm:-inset-5" aria-hidden="true">
                {[
                  "left-0 top-0 border-l-2 border-t-2",
                  "right-0 top-0 border-r-2 border-t-2",
                  "left-0 bottom-0 border-b-2 border-l-2",
                  "bottom-0 right-0 border-b-2 border-r-2",
                ].map((pos) => (
                  <span key={pos} className={`absolute h-7 w-7 border-brand/45 ${pos}`} />
                ))}
              </div>

              {/* Halo detrás del producto: lo despega del fondo. */}
              <div
                className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[85%] w-[85%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-[70px]"
                style={{ background: "radial-gradient(circle, #f0b92a 0%, transparent 70%)" }}
                aria-hidden="true"
              />

              {/* Escenario. Se anima UNA capa (transform puro): el producto
                  levita entero en vez de animar foto por foto. */}
              <div className="relative h-[300px] sm:h-[380px] lg:h-[440px]">
                <div
                  className="absolute bottom-2 left-1/2 h-4 w-2/5 -translate-x-1/2 rounded-[50%] bg-black/45 blur-lg"
                  aria-hidden="true"
                />
                <div
                  className="absolute inset-x-0 top-0 bottom-8 animate-float"
                  style={{ willChange: "transform" }}
                >
                  {showcase.map(({ p, img }: any, idx: number) => (
                    <Link
                      key={p.id}
                      href={`/producto/${p.slug}`}
                      aria-hidden={idx !== sel}
                      tabIndex={idx === sel ? 0 : -1}
                      className={`absolute inset-0 transition-all duration-700 ease-out ${
                        idx === sel
                          ? "scale-100 opacity-100 blur-0"
                          : "pointer-events-none scale-90 opacity-0 blur-sm"
                      }`}
                    >
                      <SmartImage
                        src={img}
                        alt={p.name || ""}
                        priority={idx === 0}
                        sizes="(max-width: 1024px) 90vw, 430px"
                        className="object-contain drop-shadow-2xl"
                      />
                    </Link>
                  ))}
                </div>
              </div>

              {/* Ficha flotante del producto visible: nombre, precio y entrada
                  a la ficha. Es el atajo de compra dentro del hero. */}
              {activeProduct && (
                <Link
                  href={`/producto/${activeProduct.slug}`}
                  className="group relative z-10 -mt-2 flex items-center gap-3 border border-line/15 bg-surface/95 px-4 py-3 backdrop-blur-sm transition-all duration-200 hover:border-accent-400 hover:shadow-hard-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[9.5px] uppercase tracking-widest2 text-ink-muted">
                      {activeProduct.category}
                    </p>
                    <p className="mt-0.5 truncate text-sm font-bold text-ink">
                      {activeProduct.name}
                    </p>
                  </div>
                  <span className="tnum shrink-0 font-display text-xl text-brand">
                    {formatPrice(activeProduct.price)}
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0 text-ink-muted transition-transform duration-200 group-hover:translate-x-1 group-hover:text-brand"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
              )}

              {/* Paginador: barras, no puntos. Muestran avance, no sólo posición. */}
              {showcase.length > 1 && (
                <div className="mt-4 flex justify-center gap-1.5">
                  {showcase.map((_: any, idx: number) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPIdx(idx)}
                      aria-label={`Producto ${idx + 1}`}
                      aria-current={idx === sel}
                      className={`h-[3px] transition-all duration-300 ${
                        idx === sel
                          ? "w-8 bg-accent-400"
                          : "w-3 bg-line/25 hover:bg-line/50"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Pista de scroll: pequeña, honesta, sólo en escritorio. */}
      <div className="pointer-events-none absolute bottom-4 left-1/2 hidden -translate-x-1/2 lg:block" aria-hidden="true">
        <span className="flex animate-nudge-y flex-col items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest2 text-ink-muted">
          {t("hero.scroll")}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </div>
    </section>
  );
}
