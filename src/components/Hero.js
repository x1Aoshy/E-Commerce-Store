"use client";

import { useEffect, useState } from "react";
import { useBranding } from "@/context/BrandingContext";

export default function Hero() {
  const { heroImages } = useBranding();
  const images = Array.isArray(heroImages) ? heroImages.filter(Boolean) : [];
  const [current, setCurrent] = useState(0);

  // Carrusel automático del fondo (sólo si hay más de una imagen).
  useEffect(() => {
    if (images.length < 2) return;
    const t = setInterval(
      () => setCurrent((c) => (c + 1) % images.length),
      5000
    );
    return () => clearInterval(t);
  }, [images.length]);

  const active = images.length ? current % images.length : 0;
  const hasImage = images.length > 0;

  return (
    <section id="top" className="relative overflow-hidden">
      {/* Fondo (gym/productos) configurable desde Ajustes. Si hay varias, rotan
          en carrusel con crossfade. Overlays para fundir con el header y dejar
          el texto legible aun sobre fondos claros. */}
      {hasImage && (
        <div className="absolute inset-0 z-0" aria-hidden="true">
          {images.map((src, idx) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={src}
              alt=""
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-out ${
                idx === active ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
          {/* Fundido vertical: oscuro arriba (header) y abajo (productos). */}
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#0a0c0d_0%,transparent_28%,transparent_82%,#0a0c0d_100%)]" />
          {/* Velo oscuro del lado del texto (izquierda) para que las letras
              SIEMPRE se lean, aunque el fondo sea blanco. A la derecha se vuelve
              transparente para no tapar el logo. */}
          <div className="absolute inset-0 bg-gradient-to-r from-night via-night/80 to-transparent sm:via-night/65" />
          {/* Refuerzo inferior para separar del contenido siguiente. */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-night to-transparent" />
        </div>
      )}

      <div className="container-content relative z-10 flex min-h-[88vh] flex-col justify-center pb-16 pt-10 sm:pt-16">
        <h1
          className="max-w-2xl animate-fade-in text-[2rem] font-extrabold leading-[1.05] text-ink [text-shadow:0_2px_18px_rgba(0,0,0,0.6)] min-[380px]:text-4xl sm:text-6xl md:text-7xl"
          style={{ animationDelay: "80ms", animationFillMode: "both" }}
        >
          Tu mejor versión
          <br />
          empieza con{" "}
          <span className="text-accent-400">RESULTADOS</span>
        </h1>

        <p
          className="mt-6 max-w-xl animate-fade-in text-base leading-relaxed text-ink [text-shadow:0_1px_10px_rgba(0,0,0,0.7)] sm:text-lg"
          style={{ animationDelay: "160ms", animationFillMode: "both" }}
        >
          Suplementos de alta pureza para entrenar, recuperarte y rendir al
          máximo. Elegí el tuyo y hacé tu pedido en segundos por WhatsApp.
        </p>

        <div
          className="mt-8 flex flex-wrap items-center gap-3 animate-fade-in"
          style={{ animationDelay: "240ms", animationFillMode: "both" }}
        >
          <a href="#productos" className="btn-accent px-6 py-3 text-[15px]">
            Ver productos
          </a>
          <a href="#beneficios" className="btn-ghost px-6 py-3 text-[15px]">
            Por qué Titan
          </a>
        </div>
      </div>
    </section>
  );
}
