"use client";

import { useEffect, useRef, useState } from "react";

// Número que sube desde 0 cuando entra en pantalla. Se usa en la barra de
// prueba social ("+1.200 pedidos entregados"): un número que se mueve se lee
// como un hecho vivo, no como texto decorativo.
//
// Va con requestAnimationFrame y easing out — nunca con setInterval, que se
// desincroniza del refresco de pantalla.
export default function CountUp({
  to,
  duration = 1600,
  suffix = "",
  prefix = "",
  decimals = 0,
  className = "",
}: {
  to: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [value, setValue] = useState(0);
  const done = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reduce || typeof IntersectionObserver === "undefined") {
      setValue(to);
      return;
    }

    const run = () => {
      if (done.current) return;
      done.current = true;

      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / duration);
        // easeOutExpo: arranca rápido y frena — se siente "contado".
        const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
        setValue(to * eased);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        run();
      },
      // Umbral 0: basta con que asome. Con 0.4 había cifras que nunca llegaban
      // a mostrarse y se quedaban clavadas en "0.0" — y un promedio de reseñas
      // en cero dice justo lo contrario de lo que la tienda quiere decir.
      { threshold: 0, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);

    // Red de seguridad: pase lo que pase, a los 2,5 s la cifra real está en
    // pantalla. El dato importa; la animación es un adorno.
    const failsafe = setTimeout(() => {
      if (!done.current) {
        done.current = true;
        setValue(to);
      }
    }, 2500);

    return () => {
      io.disconnect();
      clearTimeout(failsafe);
    };
  }, [to, duration]);

  const shown = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString("es-NI");

  return (
    <span ref={ref} className={`tnum ${className}`}>
      {prefix}
      {shown}
      {suffix}
    </span>
  );
}
