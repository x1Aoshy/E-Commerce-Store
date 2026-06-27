"use client";

import { useEffect, useState } from "react";
import { useBranding } from "@/context/BrandingContext";

const PHONE = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/[^\d]/g, "");

export default function Hero() {
  const { heroImages, whatsappNumber } = useBranding();
  const images = Array.isArray(heroImages) ? heroImages.filter(Boolean) : [];
  const [current, setCurrent] = useState(0);

  // Link directo a WhatsApp para el botón "Pedir por WhatsApp".
  const phone = (whatsappNumber || "").replace(/[^\d]/g, "") || PHONE;
  const waUrl = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(
        "¡Hola! Quiero hacer un pedido 💪"
      )}`
    : "#productos";

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
        <div className="absolute inset-0 z-0 bg-night" aria-hidden="true">
          {images.map((src, idx) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={src}
              alt=""
              // object-contain: muestra la imagen COMPLETA (sin recortar ni
              // agrandar). El relleno que sobra queda en `night`, que combina con
              // el fondo oscuro de la imagen. Así se ve como tu mockup en vez de
              // estirarse y tapar todo.
              className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-[1200ms] ease-out ${
                idx === active ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
          {/* Velo suave a la izquierda para que el texto se lea sobre la imagen,
              sin oscurecerla de más. */}
          <div className="absolute inset-0 bg-gradient-to-r from-night via-night/45 to-transparent" />
          {/* Fundido inferior para separar del contenido siguiente. */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-night to-transparent" />
        </div>
      )}

      <div className="container-content relative z-10 flex min-h-[64vh] flex-col justify-center pb-16 pt-10 sm:min-h-[88vh] sm:pt-16">
        <span
          className="animate-fade-in text-xs font-semibold uppercase tracking-[0.22em] text-green-400 [text-shadow:0_1px_10px_rgba(0,0,0,0.7)] sm:text-sm"
          style={{ animationFillMode: "both" }}
        >
          Suplementos de alta pureza
        </span>
        <h1
          className="mt-3 max-w-2xl animate-fade-in text-[2rem] font-extrabold leading-[1.05] text-ink [text-shadow:0_2px_18px_rgba(0,0,0,0.6)] min-[380px]:text-4xl sm:text-6xl md:text-7xl"
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
            Pedir por WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
