"use client";

import { useState } from "react";
import Reveal from "@/components/Reveal";
import { useBranding } from "@/context/BrandingContext";
import { useLang } from "@/context/LanguageContext";

/* ==========================================================================
   PREGUNTAS FRECUENTES
   --------------------------------------------------------------------------
   Última sección antes del pie, y la más rentable de todas: cada duda que se
   responde acá es un pedido que no se pierde en el chat. Son exactamente las
   cinco preguntas que llegan por WhatsApp todos los días (envío, pago,
   originalidad, cambios, asesoría).

   Acordeón de una sola apertura, con reglas horizontales y sin cajas: el
   bloque se lee como un índice, no como un montón de tarjetas. Debajo, la
   salida al chat para lo que no esté contemplado.
   ========================================================================== */

function Row({
  q,
  a,
  open,
  onToggle,
  index,
}: {
  q: string;
  a: string;
  open: boolean;
  onToggle: () => void;
  index: number;
}) {
  return (
    <div className="border-b border-line/12">
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="group flex w-full items-start gap-4 py-6 text-left"
      >
        <span className="tnum mt-0.5 shrink-0 font-mono text-[11px] font-bold tracking-widest text-accent-400">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="flex-1 text-base font-extrabold leading-snug text-ink transition-colors group-hover:text-accent-300 sm:text-lg">
          {q}
        </span>
        {/* Cruz que rota a "menos": un solo elemento para los dos estados. */}
        <span className="relative mt-1 h-4 w-4 shrink-0 text-ink-soft" aria-hidden="true">
          <span className="absolute left-0 top-1/2 h-[1.5px] w-4 -translate-y-1/2 bg-current" />
          <span
            className={`absolute left-1/2 top-0 h-4 w-[1.5px] -translate-x-1/2 bg-current transition-transform duration-300 ease-out ${
              open ? "rotate-90 opacity-0" : ""
            }`}
          />
        </span>
      </button>

      {/* Apertura con grid-rows: anima a altura real sin medir nada en JS. */}
      <div
        className={`grid transition-all duration-400 ease-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <p className="max-w-prose2 pb-6 pl-9 text-[14px] leading-relaxed text-ink-soft">
            {a}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function FAQ() {
  const { t } = useLang();
  const { whatsappNumber } = useBranding();
  const [open, setOpen] = useState(0);

  const phone = (whatsappNumber || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(
    /[^\d]/g,
    ""
  );
  const waUrl = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent("¡Hola! Tengo una consulta 💪")}`
    : "";

  const items = [
    { q: t("faq.q1"), a: t("faq.a1") },
    { q: t("faq.q2"), a: t("faq.a2") },
    { q: t("faq.q3"), a: t("faq.a3") },
    { q: t("faq.q4"), a: t("faq.a4") },
    { q: t("faq.q5"), a: t("faq.a5") },
  ];

  return (
    <section id="faq" className="scroll-mt-28 py-14 sm:py-20">
      <div className="container-content grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <Reveal variant="left">
          <div className="lg:sticky lg:top-28">
            <p className="eyebrow">{t("faq.eyebrow")}</p>
            <h2 className="headline mt-2 text-4xl text-ink sm:text-5xl">
              {t("faq.heading")}
            </h2>
            <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-ink-soft">
              {t("faq.sub")}
            </p>
            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-wa mt-6 px-6 py-3.5 text-[12px]"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                  <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l-.999 3.648 3.978-1.044zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
                {t("faq.cta")}
              </a>
            )}
          </div>
        </Reveal>

        <Reveal variant="right" delay={100}>
          <div className="border-t border-line/12">
            {items.map((it, i) => (
              <Row
                key={it.q}
                q={it.q}
                a={it.a}
                index={i}
                open={open === i}
                onToggle={() => setOpen(open === i ? -1 : i)}
              />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
