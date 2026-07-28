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

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || done.current) return;
        done.current = true;
        io.disconnect();

        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / duration);
          // easeOutExpo: arranca rápido y frena — se siente "contado".
          const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
          setValue(to * eased);
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
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
