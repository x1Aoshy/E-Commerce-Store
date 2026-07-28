"use client";

import { useEffect, useRef, useState } from "react";

// Hook de aparición al hacer scroll. Devuelve un ref + estilos para que un
// bloque entre en escena cuando llega al viewport.
//
// Frente a la versión anterior (sólo fade-up) ahora hay VARIANTES, porque el
// sentido del movimiento cuenta algo: `up` para bloques de contenido, `left`/
// `right` para elementos que acompañan una rejilla, `scale` para fotos que se
// acercan y `mask` (barrido vertical) para titulares de póster.
//
// Respeta prefers-reduced-motion: si el usuario pidió menos movimiento, el
// contenido se muestra de una y no se registra ningún observer.

export type RevealVariant = "up" | "down" | "left" | "right" | "scale" | "mask" | "fade";

const HIDDEN: Record<RevealVariant, string> = {
  up: "translate-y-8 opacity-0",
  down: "-translate-y-8 opacity-0",
  left: "-translate-x-10 opacity-0",
  right: "translate-x-10 opacity-0",
  scale: "scale-[0.94] opacity-0",
  mask: "translate-y-[110%]",
  fade: "opacity-0",
};

const SHOWN: Record<RevealVariant, string> = {
  up: "translate-y-0 opacity-100",
  down: "translate-y-0 opacity-100",
  left: "translate-x-0 opacity-100",
  right: "translate-x-0 opacity-100",
  scale: "scale-100 opacity-100",
  mask: "translate-y-0",
  fade: "opacity-100",
};

export function useReveal({
  delay = 0,
  variant = "up",
  duration = 700,
  once = true,
  // Umbral 0 = basta con que asome UN píxel. Con umbrales altos (0.1+), un
  // bloque más alto que la pantalla puede no alcanzar nunca el porcentaje y
  // quedarse invisible para siempre: el contenido no puede depender de que la
  // animación se dispare.
  threshold = 0,
}: {
  delay?: number;
  variant?: RevealVariant;
  duration?: number;
  once?: boolean;
  threshold?: number;
} = {}) {
  const ref = useRef<any>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          if (once) io.disconnect();
        } else if (!once) {
          setShown(false);
        }
      },
      { threshold, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);

    // Red de seguridad: si por lo que sea el observer nunca dispara (layout que
    // se mueve, navegador raro, pestaña restaurada), a los 2.5 s se muestra
    // igual. Una animación que no ocurre es un detalle; contenido que nunca
    // aparece es una venta perdida.
    const failsafe = setTimeout(() => setShown(true), 2500);

    return () => {
      io.disconnect();
      clearTimeout(failsafe);
    };
  }, [once, threshold]);

  return {
    ref,
    shown,
    style: {
      transitionDelay: `${delay}ms`,
      transitionDuration: `${duration}ms`,
    } as React.CSSProperties,
    className: `transform-gpu transition-all ease-out will-change-transform ${
      shown ? SHOWN[variant] : HIDDEN[variant]
    }`,
  };
}
