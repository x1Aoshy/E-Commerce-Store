"use client";

import Reveal from "@/components/Reveal";
import { useLang } from "@/context/LanguageContext";

/* ==========================================================================
   BANDA DE GARANTÍAS
   --------------------------------------------------------------------------
   Va inmediatamente debajo del hero porque ahí es donde aparece la primera
   objeción real: "¿esto es confiable?". Cuatro respuestas cortas, con ícono,
   antes de que el cliente llegue siquiera a mirar un precio.

   Sin tarjetas ni sombras: cuatro celdas separadas por hairlines, como una
   ficha técnica. El movimiento es mínimo — el ícono gira apenas al pasar el
   cursor, lo justo para que se sienta vivo y no animado por animar.
   ========================================================================== */

function Icon({ name }: { name: string }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-6 w-6",
    "aria-hidden": true,
  };
  if (name === "truck")
    return (
      <svg {...common}>
        <path d="M3 16V6h11v10M14 9h4l3 3.5V16h-7" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="17" cy="18" r="2" />
      </svg>
    );
  if (name === "shield")
    return (
      <svg {...common}>
        <path d="M12 3 4 6v6c0 5 3.4 8.6 8 9.5 4.6-.9 8-4.5 8-9.5V6z" />
        <path d="m9 12 2 2 4-4.5" />
      </svg>
    );
  if (name === "cash")
    return (
      <svg {...common}>
        <rect x="2" y="6" width="20" height="12" rx="1" />
        <circle cx="12" cy="12" r="2.6" />
        <path d="M6 12h.01M18 12h.01" />
      </svg>
    );
  return (
    <svg {...common}>
      <path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3z" />
      <path d="M8.5 9c0 4 2.5 6.5 6.5 6.5" />
    </svg>
  );
}

export default function ValueStrip() {
  const { t } = useLang();

  const items = [
    { icon: "truck", title: t("value.ship.t"), sub: t("value.ship.s") },
    { icon: "shield", title: t("value.orig.t"), sub: t("value.orig.s") },
    { icon: "cash", title: t("value.pay.t"), sub: t("value.pay.s") },
    { icon: "chat", title: t("value.help.t"), sub: t("value.help.s") },
  ];

  return (
    <section className="border-b border-line/10 bg-surface/30">
      <div className="container-content">
        <div className="grid grid-cols-2 gap-px bg-line/10 lg:grid-cols-4">
          {items.map((it, i) => (
            <Reveal key={it.title} delay={i * 90} variant="up">
              <div className="group flex h-full items-start gap-3.5 bg-night px-4 py-6 sm:px-6 sm:py-8">
                <span className="shrink-0 text-accent-400 transition-transform duration-500 ease-out group-hover:-rotate-12 group-hover:scale-110">
                  <Icon name={it.icon} />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-extrabold uppercase tracking-wide text-ink">
                    {it.title}
                  </p>
                  <p className="mt-1 text-[12px] leading-snug text-ink-muted">{it.sub}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
