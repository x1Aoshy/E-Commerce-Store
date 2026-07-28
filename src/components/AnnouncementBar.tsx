"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useBranding } from "@/context/BrandingContext";
import { useLang } from "@/context/LanguageContext";

/* ==========================================================================
   BARRA DE ANUNCIOS
   --------------------------------------------------------------------------
   Antes: una cinta negra con cinco mensajes en mayúsculas corriendo sin parar.
   El bloque negro se llevaba el primer golpe de vista antes de que el cliente
   viera un producto, el movimiento constante obligaba a perseguir el texto y,
   con todo pasando a la vez, no se leía nada.

   Qué hace esta versión distinto:

   · UN mensaje a la vez, rotando. El movimiento ocurre sólo en el cambio
     —dinámico sin ser inquieto— y entra como cinta métrica: el que sale sube,
     el que entra viene desde abajo.
   · Cada mensaje LLEVA A ALGÚN LADO. "Envío en 24h" abre las preguntas
     frecuentes donde eso está explicado; "asesoría gratis" abre el chat. Deja
     de ser decoración y pasa a ser un atajo.
   · Indicador segmentado: cinco marcas, la activa se llena en tiempo real.
     Se ve de un vistazo cuántos avisos hay y cuándo cambia — el lenguaje de
     una historia, que este cliente ya sabe leer.
   · Tono cálido de marca (oro muy diluido) en vez del bloque negro: la barra
     existe y se lee, pero no compite con el logo ni con la foto del producto.
   · A la izquierda, en escritorio, el WhatsApp real de la tienda: el espacio
     sobrante se usa para algo útil en vez de quedar vacío.
   · Se puede CERRAR. Lo que se pone arriba de todo sin pedir permiso tiene que
     poder quitarse; dura la sesión y vuelve en la próxima visita.

   Se pausa al pasar el cursor —para leer con calma— y con la pestaña oculta.
   Con `prefers-reduced-motion` no se desliza: cambia y ya.
   ========================================================================== */

const ROTATE_MS = 4800;
const STORAGE_KEY = "titan_ann_off";

function Icon({ name }: { name: string }) {
  const c = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-[15px] w-[15px]",
    "aria-hidden": true,
  };
  if (name === "truck")
    return (
      <svg {...c}>
        <path d="M3 16V6h11v10M14 9h4l3 3.5V16h-7" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="17" cy="18" r="2" />
      </svg>
    );
  if (name === "cash")
    return (
      <svg {...c}>
        <rect x="2" y="6" width="20" height="12" rx="1" />
        <circle cx="12" cy="12" r="2.6" />
      </svg>
    );
  if (name === "shield")
    return (
      <svg {...c}>
        <path d="M12 3 4 6v6c0 5 3.4 8.6 8 9.5 4.6-.9 8-4.5 8-9.5V6z" />
        <path d="m9 12 2 2 4-4.5" />
      </svg>
    );
  if (name === "spark")
    return (
      <svg {...c}>
        <path d="M12 3v3.5M12 17.5V21M3 12h3.5M17.5 12H21M5.9 5.9l2.5 2.5M15.6 15.6l2.5 2.5M18.1 5.9l-2.5 2.5M8.4 15.6l-2.5 2.5" />
      </svg>
    );
  return (
    <svg {...c}>
      <path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3z" />
      <path d="M8.5 9c0 4 2.5 6.5 6.5 6.5" />
    </svg>
  );
}

export default function AnnouncementBar() {
  const { t } = useLang();
  const { whatsappNumber } = useBranding();

  const [i, setI] = useState(0);
  const [open, setOpen] = useState(true);
  const [paused, setPaused] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [reduce, setReduce] = useState(false);
  // Índice anterior: hace que el saliente y el entrante se muevan en el mismo
  // sentido, y así el cambio se lee como un giro y no como un salto.
  const prev = useRef(0);

  const phone = (whatsappNumber || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(
    /[^\d]/g,
    ""
  );
  const waUrl = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent("¡Hola! Tengo una consulta 💪")}`
    : "";
  // Un bloque de once dígitos no se lee como un teléfono. Agrupado, sí.
  const prettyPhone = phone
    ? `+${phone.slice(0, 3)} ${phone.slice(3, 7)} ${phone.slice(7)}`.trim()
    : "";

  const items = useMemo(
    () => [
      { icon: "truck", text: t("hero.trust1"), href: "/#faq" },
      { icon: "cash", text: t("hero.trust2"), href: "/#faq" },
      { icon: "shield", text: t("ticker.original"), href: "/#faq" },
      { icon: "chat", text: t("hero.trust3"), href: waUrl || "/#faq" },
      { icon: "spark", text: t("ticker.support"), href: waUrl || "/#faq" },
    ],
    [t, waUrl]
  );

  useEffect(() => {
    setMounted(true);
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === "1") setOpen(false);
    } catch {
      /* sin almacenamiento: la barra simplemente se muestra */
    }
    setReduce(!!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (!open || paused) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") {
        prev.current = i;
        setI((n) => (n + 1) % items.length);
      }
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [open, paused, i, items.length]);

  const dismiss = useCallback(() => {
    setOpen(false);
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* da igual: se cierra igual en esta vista */
    }
  }, []);

  const goTo = (idx: number) => {
    prev.current = i;
    setI(idx);
  };

  if (!open) return null;

  return (
    <div
      className="relative z-30 border-b border-accent-400/25 bg-accent-400/[0.045]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Halo cálido centrado: la luz cae donde está el mensaje. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgb(240 185 42 / 0.10) 50%, transparent 100%)",
        }}
        aria-hidden="true"
      />

      <div className="container-content relative flex h-10 items-center gap-4">
        {/* ---- Izquierda (escritorio): contacto real, no relleno ---------- */}
        {waUrl ? (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden shrink-0 items-center gap-1.5 text-[11.5px] font-medium text-ink-muted transition-colors hover:text-ink lg:flex"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-ok" fill="currentColor" aria-hidden="true">
              <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l-.999 3.648 3.978-1.044z" />
            </svg>
            {prettyPhone}
          </a>
        ) : (
          <span className="hidden lg:block lg:w-32" aria-hidden="true" />
        )}

        {/* ---- Centro: el mensaje que rota ------------------------------- */}
        <div className="relative h-10 flex-1 overflow-hidden">
          {items.map((it, idx) => {
            const active = idx === i;
            const leaving = idx === prev.current && !active;
            const Wrapper: any = it.href.startsWith("http") ? "a" : Link;
            const linkProps = it.href.startsWith("http")
              ? { href: it.href, target: "_blank", rel: "noopener noreferrer" }
              : { href: it.href };

            return (
              <div
                key={it.text}
                aria-hidden={!active}
                className={`absolute inset-0 flex items-center justify-center transition-all duration-[520ms] ease-out ${
                  reduce
                    ? active
                      ? "opacity-100"
                      : "opacity-0"
                    : active
                      ? "translate-y-0 opacity-100"
                      : leaving
                        ? "-translate-y-full opacity-0"
                        : "translate-y-full opacity-0"
                }`}
              >
                <Wrapper
                  {...linkProps}
                  tabIndex={active ? 0 : -1}
                  className="group inline-flex items-center gap-2 px-2"
                >
                  <span
                    key={`${it.text}-${active}`}
                    className={`shrink-0 text-brand transition-transform duration-300 group-hover:scale-110 ${
                      active && !reduce ? "animate-scale-in" : ""
                    }`}
                  >
                    <Icon name={it.icon} />
                  </span>
                  <span className="truncate text-[12.5px] font-semibold tracking-tight text-ink">
                    {it.text}
                  </span>
                  <svg
                    className="h-3 w-3 shrink-0 text-ink-muted transition-transform duration-300 group-hover:translate-x-1"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Wrapper>
              </div>
            );
          })}
        </div>

        {/* ---- Derecha: indicador segmentado + cierre --------------------- */}
        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden items-center gap-1 sm:flex">
            {items.map((it, idx) => (
              <button
                key={it.text}
                type="button"
                onClick={() => goTo(idx)}
                aria-label={`${t("ann.go")} ${idx + 1}`}
                aria-current={idx === i}
                className="h-2.5 w-4 py-1"
              >
                <span className="relative block h-[2px] w-full overflow-hidden bg-line/15">
                  {/* La marca activa se llena en tiempo real; las ya vistas
                      quedan tenues. `key` reinicia la animación en cada vuelta. */}
                  <span
                    key={`${idx}-${i}`}
                    className={`absolute inset-0 origin-left bg-brand ${
                      idx === i ? "" : "opacity-0"
                    }`}
                    style={
                      idx === i && mounted && !reduce
                        ? {
                            animation: `bar-fill ${ROTATE_MS}ms linear both`,
                            animationPlayState: paused ? "paused" : "running",
                          }
                        : idx === i
                          ? { transform: "scaleX(1)" }
                          : undefined
                    }
                  />
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={dismiss}
            aria-label={t("ann.close")}
            className="-mr-2 flex h-8 w-8 items-center justify-center text-ink-muted transition-colors hover:text-ink"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
