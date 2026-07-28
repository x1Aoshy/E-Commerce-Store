"use client";

import { useReveal, type RevealVariant } from "@/lib/useReveal";

// Envoltorio de aparición al scroll. `variant` elige el sentido del movimiento
// (ver lib/useReveal). Se usa en toda la tienda para que las secciones entren
// escalonadas en vez de aparecer todas de golpe.
export default function Reveal({
  children,
  delay = 0,
  variant = "up",
  duration = 700,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  variant?: RevealVariant;
  duration?: number;
  className?: string;
  as?: any;
}) {
  const r = useReveal({ delay, variant, duration });
  return (
    <Tag ref={r.ref} style={r.style} className={`${r.className} ${className}`}>
      {children}
    </Tag>
  );
}

// Variante para listas: escalona a los hijos con un retraso incremental.
export function RevealStagger({
  children,
  step = 70,
  variant = "up",
  className = "",
}: {
  children: React.ReactNode;
  step?: number;
  variant?: RevealVariant;
  className?: string;
}) {
  const items = Array.isArray(children) ? children : [children];
  return (
    <>
      {items.map((child, i) => (
        <Reveal key={i} delay={i * step} variant={variant} className={className}>
          {child}
        </Reveal>
      ))}
    </>
  );
}
