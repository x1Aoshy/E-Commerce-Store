"use client";

import Image from "next/image";

// Imagen optimizada con next/image (redimensiona y sirve WebP/AVIF desde el
// CDN según el tamaño real en pantalla) para las fotos alojadas en Supabase.
//
// RESILIENCIA: next/image LANZA un error si el host de la URL no está permitido
// en next.config — si alguna URL vieja/externa se colara, tiraría abajo la
// página. Por eso, ante un host desconocido caemos a un <img> normal en vez de
// romper. Usa modo `fill`: el PADRE debe ser position:relative con tamaño.
const SUPABASE_HOST = /^https:\/\/[a-z0-9-]+\.supabase\.co\//i;

export default function SmartImage({
  src,
  alt = "",
  className = "",
  sizes = "100vw",
  priority = false,
  quality = 75,
}: {
  src: string;
  alt?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  quality?: number;
}) {
  if (!src) return null;

  if (!SUPABASE_HOST.test(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={`absolute inset-0 h-full w-full ${className}`}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      quality={quality}
      priority={priority}
      className={className}
    />
  );
}
