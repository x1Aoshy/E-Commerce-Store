"use client";

import { useReveal } from "@/lib/useReveal";

// Envoltorio reutilizable para animar la aparición de un bloque al hacer scroll.
export default function Reveal({ children, delay = 0, className = "" }) {
  const r = useReveal({ delay });
  return (
    <div ref={r.ref} style={r.style} className={`${r.className} ${className}`}>
      {children}
    </div>
  );
}
