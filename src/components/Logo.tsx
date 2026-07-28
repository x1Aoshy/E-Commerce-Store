"use client";

// Marca de la tienda. Por defecto dibuja un monograma en SVG (escudo recto con
// una cumbre dorada) y el nombre en la tipografía de póster. Si el dueño subió
// un logo desde Ajustes, se muestra esa imagen en lugar del monograma.
//
// SEGURIDAD: un logo SVG subido se muestra SIEMPRE vía <img src>, nunca inline
// (sin dangerouslySetInnerHTML), así no se ejecuta ningún script embebido.

import { useBranding } from "@/context/BrandingContext";

// Escudo de líneas rectas y esquina troquelada: la misma geometría que las
// insignias de oferta, así el logo pertenece al sistema en vez de ser un
// adorno pegado encima.
export function LogoMark({ size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      {/* Cuerpo del escudo, con el vértice inferior cortado en diagonal. */}
      <path
        d="M4 3h24v14.2c0 6.4-4.6 10.5-12 11.8C8.6 27.7 4 23.6 4 17.2z"
        fill="#12281f"
        stroke="#db9e13"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* Cumbre: la "montaña" de la fuerza. */}
      <path
        d="M9.5 21 16 9.5 22.5 21"
        fill="none"
        stroke="#f0b92a"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 21h8" stroke="#f0b92a" strokeWidth="2.3" strokeLinecap="round" />
    </svg>
  );
}

export default function Logo({ size = 30, className = "", imgClass = "h-9 sm:h-10" }) {
  const { storeName, logoUrl, loginIconUrl } = useBranding();
  // Puede quedar vacío a propósito (cuando el logo ya trae el nombre).
  const name = storeName || "";
  // Usa el logo si lo hay; si no, cae al "Icon" subido (así con una sola imagen
  // ya aparece en el header, el favicon y el sidebar).
  const img = logoUrl || loginIconUrl;

  // Con imagen subida mostramos SÓLO la imagen: suele traer su propio nombre y
  // duplicarlo se ve amateur.
  if (img) {
    return (
      <span className={`inline-flex items-center ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img}
          alt={name || "Logo"}
          className={`${imgClass} w-auto max-w-[200px] object-contain`}
        />
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      {name && (
        <span className="headline text-lg leading-none text-ink sm:text-xl">{name}</span>
      )}
    </span>
  );
}
