"use client";

import { useMemo } from "react";

// Cinta infinita (ticker). Duplica el contenido y desplaza exactamente media
// pista, así el bucle no tiene costura visible. Es CSS puro sobre transform:
// corre en el compositor y no toca el hilo principal.
//
// Se usa en la barra de anuncios y en la banda de marca: el movimiento
// horizontal constante es lo que separa una tienda "viva" de una plantilla.
export default function Marquee({
  children,
  speed = 32,
  reverse = false,
  pauseOnHover = true,
  className = "",
  itemClassName = "",
}: {
  children: React.ReactNode[] | React.ReactNode;
  /** Segundos que tarda en recorrer una pista completa. Más = más lento. */
  speed?: number;
  reverse?: boolean;
  pauseOnHover?: boolean;
  className?: string;
  itemClassName?: string;
}) {
  const items = useMemo(
    () => (Array.isArray(children) ? children : [children]),
    [children]
  );

  // Una pista = la lista completa. Se pinta dos veces (la copia va oculta a
  // lectores de pantalla para no repetir el texto en voz alta).
  const track = (aria: boolean) =>
    items.map((child, i) => (
      <span
        key={`${aria ? "a" : "b"}-${i}`}
        className={`shrink-0 ${itemClassName}`}
        aria-hidden={aria ? undefined : true}
      >
        {child}
      </span>
    ));

  return (
    <div
      className={`marquee-mask overflow-hidden ${
        pauseOnHover ? "marquee-hover" : ""
      } ${className}`}
    >
      <div
        className="marquee-track"
        style={{
          ["--marquee-duration" as any]: `${speed}s`,
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        {track(true)}
        {track(false)}
      </div>
    </div>
  );
}
