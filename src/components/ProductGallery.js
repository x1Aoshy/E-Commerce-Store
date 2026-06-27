"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import ProductImage from "./ProductImage";
import { productImages, isVideo } from "@/lib/images";

// Galería de medios del producto: flechas suaves, puntitos indicadores y swipe
// táctil. Si hay 0/1 medio, muestra la imagen (o el placeholder) sin controles.
// `href` (opcional) hace que tocar la imagen navegue; las flechas/puntos no.
export default function ProductGallery({ product, href, className = "", controls = false, fit = "cover" }) {
  const media = productImages(product);
  const [i, setI] = useState(0);
  const startX = useRef(null);
  const count = media.length;
  const fitClass = fit === "contain" ? "object-contain" : "object-cover";

  function Slide({ src }) {
    return isVideo(src) ? (
      <video
        src={src}
        className={`h-full w-full ${fitClass} ${className}`}
        muted={!controls}
        playsInline
        controls={controls}
        preload="metadata"
      />
    ) : (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={product?.name || ""} className={`h-full w-full ${fitClass} ${className}`} />
    );
  }

  // Sin medios: placeholder por categoría (ilustración autocontenida).
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

  const go = (n) => setI((n + count) % count);

  const onTouchStart = (e) => {
    startX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e) => {
    if (startX.current == null || count < 2) return;
    const dx = (e.changedTouches[0]?.clientX ?? 0) - startX.current;
    if (Math.abs(dx) > 40) go(dx < 0 ? i + 1 : i - 1);
    startX.current = null;
  };

  return (
    <div
      className="group/gal relative h-full w-full overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div
        className="flex h-full w-full transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${i * 100}%)` }}
      >
        {media.map((src, idx) => (
          <div key={idx} className="h-full w-full shrink-0 grow-0 basis-full">
            {href ? (
              <Link href={href} aria-label={`Ver ${product?.name || ""}`} className="block h-full w-full">
                <Slide src={src} />
              </Link>
            ) : (
              <Slide src={src} />
            )}
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              go(i - 1);
            }}
            aria-label="Anterior"
            className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white opacity-0 ring-1 ring-white/20 transition hover:bg-black/80 group-hover/gal:opacity-100 max-md:opacity-100"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              go(i + 1);
            }}
            aria-label="Siguiente"
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white opacity-0 ring-1 ring-white/20 transition hover:bg-black/80 group-hover/gal:opacity-100 max-md:opacity-100"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>

          <div className="absolute inset-x-0 bottom-2.5 flex justify-center gap-1.5">
            {media.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setI(idx);
                }}
                aria-label={`Ver imagen ${idx + 1}`}
                className={`h-1.5 rounded-full shadow-sm transition-all duration-200 ${
                  idx === i ? "w-4 bg-white" : "w-1.5 bg-white/55 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
