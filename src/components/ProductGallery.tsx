"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ProductImage from "./ProductImage";
import SmartImage from "./SmartImage";
import { productImages, isVideo } from "@/lib/images";

/* ==========================================================================
   GALERÍA DE MEDIOS DEL PRODUCTO
   --------------------------------------------------------------------------
   Dos modos, porque una tarjeta y una ficha no necesitan lo mismo:

   · `hoverPlay` (TARJETA del catálogo): sin flechas ni puntos. Al pasar el
     cursor, el segundo medio aparece fundido encima — y si es un VIDEO, se
     reproduce solo. Es el truco de las tiendas de ropa: el producto se mueve
     cuando lo mirás, y eso sube el clic a la ficha muchísimo.
     El video se pausa y rebobina al salir, así no consume nada de fondo.

   · `controls` (FICHA del producto): carrusel completo con flechas, tira de
     miniaturas y swipe. Ahí el cliente sí quiere inspeccionar.
   ========================================================================== */

interface GalleryProps {
  product: any;
  href?: string;
  className?: string;
  controls?: boolean;
  fit?: "cover" | "contain" | string;
  sizes?: string;
  priority?: boolean;
  /** Modo tarjeta: cambio de medio + autoplay de video al pasar el cursor. */
  hoverPlay?: boolean;
}

export default function ProductGallery({
  product,
  href,
  className = "",
  controls = false,
  fit = "cover",
  sizes,
  priority = false,
  hoverPlay = false,
}: GalleryProps) {
  const media = productImages(product);
  const count = media.length;
  const fitClass = fit === "contain" ? "object-contain" : "object-cover";

  const [i, setI] = useState(0);
  const [hover, setHover] = useState(false);
  const startX = useRef<number | null>(null);
  const hoverVideoRef = useRef<HTMLVideoElement | null>(null);

  const defaultSizes =
    sizes || "(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw";

  /* Autoplay del segundo medio SÓLO mientras el puntero está encima. */
  useEffect(() => {
    const v = hoverVideoRef.current;
    if (!v) return;
    if (hover) {
      v.play().catch(() => {});
    } else {
      v.pause();
      v.currentTime = 0;
    }
  }, [hover]);

  /* ------------------------------ Sin medios ----------------------------- */
  if (count === 0) {
    const ph = <ProductImage product={product} className={`h-full w-full ${className}`} />;
    return href ? (
      <Link href={href} aria-label={`Ver ${product?.name || ""}`} className="block h-full w-full">
        {ph}
      </Link>
    ) : (
      <div className="h-full w-full">{ph}</div>
    );
  }

  /* ------------------------- Un medio individual ------------------------- */
  const Slide = ({ src, eager = false }: { src: string; eager?: boolean }) =>
    isVideo(src) ? (
      <video
        src={src}
        className={`h-full w-full ${fitClass} ${className}`}
        muted={!controls}
        playsInline
        loop={!controls}
        controls={controls}
        preload="metadata"
      />
    ) : (
      <div className="relative h-full w-full">
        <SmartImage
          src={src}
          alt={product?.name || ""}
          priority={eager}
          sizes={defaultSizes}
          className={`${fitClass} ${className}`}
        />
      </div>
    );

  /* ===================== MODO TARJETA (hoverPlay) ======================== */
  if (hoverPlay) {
    const first = media[0];
    const second = count > 1 ? media[1] : null;

    const body = (
      <div
        className="relative h-full w-full"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {/* Medio principal: se desvanece cuando entra el secundario. */}
        <div
          className={`absolute inset-0 transition-opacity duration-500 ease-out ${
            second && hover ? "opacity-0" : "opacity-100"
          }`}
        >
          <Slide src={first} eager={priority} />
        </div>

        {/* Medio secundario: sólo se monta si existe; carga perezosa. */}
        {second && (
          <div
            className={`absolute inset-0 transition-opacity duration-500 ease-out ${
              hover ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden="true"
          >
            {isVideo(second) ? (
              <video
                ref={hoverVideoRef}
                src={second}
                muted
                loop
                playsInline
                preload="none"
                className={`h-full w-full ${fitClass} ${className}`}
              />
            ) : (
              <div className="relative h-full w-full">
                <SmartImage
                  src={second}
                  alt=""
                  sizes={defaultSizes}
                  className={`${fitClass} ${className}`}
                />
              </div>
            )}
          </div>
        )}

        {/* Contador de medios: avisa que hay más para ver en la ficha. */}
        {count > 1 && (
          <span className="pointer-events-none absolute bottom-2 right-2 z-10 bg-night/75 px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-wider text-ink-soft backdrop-blur-sm">
            {isVideo(second || "") ? "▶" : `1/${count}`}
          </span>
        )}
      </div>
    );

    return href ? (
      <Link href={href} aria-label={`Ver ${product?.name || ""}`} className="block h-full w-full">
        {body}
      </Link>
    ) : (
      body
    );
  }

  /* ======================= MODO FICHA (carrusel) ========================= */
  const go = (n: number) => setI((n + count) % count);

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (startX.current == null || count < 2) return;
    const dx = (e.changedTouches[0]?.clientX ?? 0) - startX.current;
    if (Math.abs(dx) > 40) go(dx < 0 ? i + 1 : i - 1);
    startX.current = null;
  };

  const Arrow = ({ dir }: { dir: -1 | 1 }) => (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        go(i + dir);
      }}
      aria-label={dir === -1 ? "Anterior" : "Siguiente"}
      className={`absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-line/20 bg-night/70 text-ink opacity-0 backdrop-blur-sm transition-all duration-200 hover:border-accent-400 hover:bg-accent-400 hover:text-[#17130a] group-hover/gal:opacity-100 max-md:opacity-100 ${
        dir === -1 ? "left-2" : "right-2"
      }`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d={dir === -1 ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
      </svg>
    </button>
  );

  return (
    <div className="flex h-full w-full flex-col">
      <div
        className="group/gal relative min-h-0 flex-1 overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex h-full w-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${i * 100}%)` }}
        >
          {media.map((src, idx) => (
            <div key={idx} className="h-full w-full shrink-0 grow-0 basis-full">
              {href ? (
                <Link href={href} aria-label={`Ver ${product?.name || ""}`} className="block h-full w-full">
                  <Slide src={src} eager={idx === 0 && priority} />
                </Link>
              ) : (
                <Slide src={src} eager={idx === 0 && priority} />
              )}
            </div>
          ))}
        </div>

        {count > 1 && (
          <>
            <Arrow dir={-1} />
            <Arrow dir={1} />
            {/* Índice tipo cámara: "03 / 05". */}
            <span className="tnum pointer-events-none absolute right-3 top-3 bg-night/70 px-2 py-1 font-mono text-[10px] font-bold tracking-widest text-ink-soft backdrop-blur-sm">
              {String(i + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
            </span>
          </>
        )}
      </div>

      {/* Tira de miniaturas: inspección real, no puntitos decorativos. */}
      {controls && count > 1 && (
        <div className="no-scrollbar mt-2 flex shrink-0 gap-2 overflow-x-auto">
          {media.map((src, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setI(idx)}
              aria-label={`Ver medio ${idx + 1}`}
              aria-current={idx === i}
              className={`relative h-16 w-16 shrink-0 overflow-hidden border-2 bg-surface-soft transition-colors duration-200 ${
                idx === i ? "border-accent-400" : "border-line/12 hover:border-line/35"
              }`}
            >
              {isVideo(src) ? (
                <span className="flex h-full w-full items-center justify-center text-ink-soft">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              ) : (
                <SmartImage src={src} alt="" sizes="64px" className="object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
