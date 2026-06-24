"use client";

import { useEffect, useRef, useState } from "react";

// Hook de "scroll reveal": devuelve un ref + clases para que un elemento aparezca
// con un fade-up suave cuando entra en viewport. Respeta prefers-reduced-motion
// (si el usuario pidió menos movimiento, se muestra de una sin animar).
export function useReveal({ delay = 0 } = {}) {
  const ref = useRef(null);
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
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return {
    ref,
    shown,
    style: { transitionDelay: `${delay}ms` },
    className: `transform-gpu transition-all duration-500 ease-out ${
      shown ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
    }`,
  };
}
