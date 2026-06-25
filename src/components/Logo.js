"use client";

// Marca de la tienda. Por defecto muestra un escudo en SVG (dorado + verde
// oscuro) y el nombre. Si el dueño subió un logo desde Ajustes, se muestra esa
// imagen en lugar del escudo. El nombre también sale de los Ajustes.
//
// SEGURIDAD: un logo SVG subido se muestra SIEMPRE vía <img src>, nunca inline
// (sin dangerouslySetInnerHTML), así no se ejecuta ningún script embebido.

import { useBranding } from "@/context/BrandingContext";

export function LogoMark({ size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      {/* Escudo: relleno verde oscuro, borde dorado. */}
      <path
        d="M16 2.5l11 3.8v7.9c0 8-5.2 12.2-11 14.3-5.8-2.1-11-6.3-11-14.3V6.3z"
        fill="#16382b"
        stroke="#d4a82f"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {/* Pico/cumbre dorada (fuerza). */}
      <path
        d="M10 20.5l6-10 6 10"
        fill="none"
        stroke="#e7c454"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12.3 20.5h7.4" stroke="#e7c454" strokeWidth="2.1" strokeLinecap="round" />
    </svg>
  );
}

export default function Logo({ size = 32, className = "" }) {
  const { storeName, logoUrl } = useBranding();
  const name = storeName || "Titan Supplements";

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={name}
          className="h-7 w-auto object-contain"
        />
      ) : (
        <LogoMark size={size} />
      )}
      <span className="text-[15px] font-extrabold tracking-wide text-accent-300">
        {name}
      </span>
    </span>
  );
}
