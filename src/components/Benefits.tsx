"use client";

import Reveal from "./Reveal";
import { useLang } from "@/context/LanguageContext";

// Garantías de la casa, compactas (ícono + título + una línea). Cliente para
// poder traducirse en vivo con el selector de idioma del footer.
const BENEFITS = [
  {
    k: "b1",
    icon: (
      <>
        <path d="M12 3 4 6v6c0 5 3.4 8 8 9 4.6-1 8-4 8-9V6z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
  },
  {
    k: "b2",
    icon: (
      <>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </>
    ),
  },
  {
    k: "b3",
    icon: (
      <>
        <path d="M3 7h11v8H3z" />
        <path d="M14 9h4l3 3v3h-7z" />
        <circle cx="7" cy="18" r="1.6" />
        <circle cx="17" cy="18" r="1.6" />
      </>
    ),
  },
  {
    k: "b4",
    icon: (
      <>
        <path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3z" />
        <path d="M8.5 9c0 4 2.5 6.5 6.5 6.5" />
      </>
    ),
  },
];

export default function Benefits() {
  const { t } = useLang();
  return (
    <section id="beneficios" className="border-t border-line/10">
      <div className="container-content py-10 sm:py-12">
        <div className="grid grid-cols-2 gap-x-6 gap-y-7 lg:grid-cols-4">
          {BENEFITS.map((b, i) => (
            <Reveal key={b.k} delay={i * 70}>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] bg-accent-500/15 text-accent-300 ring-1 ring-accent-500/25">
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    {b.icon}
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="text-[13px] font-semibold text-ink">
                    {t(`${b.k}t`)}
                  </h3>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
                    {t(`${b.k}x`)}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
