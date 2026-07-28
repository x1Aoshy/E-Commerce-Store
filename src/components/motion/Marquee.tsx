"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// Cinta infinita (ticker). Duplica el contenido y desplaza exactamente media
// pista, así el bucle no tiene costura visible. Es CSS puro sobre transform:
// corre en el compositor y no toca el hilo principal.
//
// RENDIMIENTO: la cinta se DETIENE cuando sale de pantalla. Sin esto, una
// página con cuatro cintas (anuncios, ofertas, reseñas, marca) mantiene cuatro
// animaciones vivas todo el tiempo, incluso las que están a tres pantallas de
// distancia — y en un teléfono de gama media eso se nota en el scroll.
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
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  const items = useMemo(
    () => (Array.isArray(children) ? children : [children]),
    [children]
  );

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), {
      // Margen generoso: la cinta ya está en marcha cuando el usuario la
      // alcanza, así nunca se ve arrancar de golpe.
      rootMargin: "200px 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

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
      ref={ref}
      className={`marquee-mask overflow-hidden ${
        pauseOnHover ? "marquee-hover" : ""
      } ${className}`}
    >
      <div
        className="marquee-track"
        style={{
          ["--marquee-duration" as any]: `${speed}s`,
          animationDirection: reverse ? "reverse" : "normal",
          animationPlayState: visible ? "running" : "paused",
        }}
      >
        {track(true)}
        {track(false)}
      </div>
    </div>
  );
}
