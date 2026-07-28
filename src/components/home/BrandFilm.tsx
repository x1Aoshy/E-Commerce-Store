"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import SmartImage from "@/components/SmartImage";
import Headline from "@/components/motion/Headline";
import { useBranding } from "@/context/BrandingContext";
import { useLang } from "@/context/LanguageContext";
import { productImages, isVideo } from "@/lib/images";
import type { Product } from "@/lib/types";

/* ==========================================================================
   EL REEL DE MARCA
   --------------------------------------------------------------------------
   Esta sección es "el video" de la tienda, y funciona de dos maneras:

   1) VIDEO REAL. Si el dueño sube un .mp4/.webm en Ajustes → Imágenes del
      hero, acá se reproduce a pantalla completa, en bucle y silenciado, con
      control de play/pausa y sonido. Cero configuración extra.

   2) REEL GENERADO (por defecto). Sin metraje propio, la sección MONTA un
      video con lo que la tienda ya tiene: las fotos de sus productos. Cada
      "toma" dura unos segundos, la foto entra con un zoom lentísimo (ken
      burns), el titular se arma palabra por palabra encima y una barra de
      progreso marca el avance — el lenguaje exacto de una historia de
      Instagram, que es donde este cliente ya sabe mirar.

      Se ve como metraje editado y no pesa un byte extra: son las mismas fotos
      del catálogo, animadas por CSS.

   En ambos casos: se PAUSA cuando la sección sale de pantalla o la pestaña se
   oculta. Un reel corriendo invisible es batería y datos tirados a la basura.
   ========================================================================== */

const SHOT_MS = 4200;

export default function BrandFilm({ products }: { products: Product[] }) {
  const { heroImages, storeName } = useBranding();
  const { t } = useLang();

  const sectionRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [shot, setShot] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [inView, setInView] = useState(false);

  const ownVideo = useMemo(() => {
    const list = Array.isArray(heroImages) ? heroImages.filter(Boolean) : [];
    return list.find((u: string) => isVideo(u)) || "";
  }, [heroImages]);

  /* --- Las tomas del reel generado: producto + frase --------------------- */
  const lines = [t("film.line1"), t("film.line2"), t("film.line3")];

  const shots = useMemo(() => {
    const pool = products
      .filter((p) => (Number(p.stock) || 0) > 0)
      .map((p) => ({ p, img: productImages(p).find((u: string) => !isVideo(u)) || "" }))
      .filter((x) => x.img);

    // Destacados primero: son las fotos que el dueño considera sus mejores.
    const ordered = [
      ...pool.filter((x) => x.p.featured),
      ...pool.filter((x) => !x.p.featured),
    ];

    return ordered.slice(0, 3).map((x, i) => ({ ...x, line: lines[i] || lines[0] }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, lines[0], lines[1], lines[2]]);

  /* --- Sólo corre cuando de verdad se está viendo ------------------------ */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), {
      threshold: 0.25,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const running = playing && inView;

  /* --- Avance de tomas (reel generado) ---------------------------------- */
  useEffect(() => {
    if (ownVideo || shots.length < 2 || !running) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") {
        setShot((s) => (s + 1) % shots.length);
      }
    }, SHOT_MS);
    return () => clearInterval(id);
  }, [ownVideo, shots.length, running]);

  /* --- Reproducción del video real -------------------------------------- */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (running) v.play().catch(() => {});
    else v.pause();
  }, [running]);

  useEffect(() => {
    const v = videoRef.current;
    if (v) v.muted = muted;
  }, [muted]);

  if (!ownVideo && shots.length === 0) return null;

  const current = shots[shot];

  return (
    <section
      ref={sectionRef}
      // `theme-dark` fuerza los tokens oscuros SÓLO en esta sección: una sala
      // de cine no cambia de color porque afuera sea de día. Con el tema claro
      // activo, el resto de la página sigue en papel y el reel se mantiene
      // negro, que es donde el metraje se ve.
      className="theme-dark relative isolate min-h-[520px] overflow-hidden border-y border-line/10 bg-night sm:min-h-[640px]"
    >
      {/* ============================ METRAJE ============================= */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        {ownVideo ? (
          <video
            ref={videoRef}
            src={ownVideo}
            loop
            muted={muted}
            playsInline
            preload="metadata"
            className="h-full w-full object-cover"
          />
        ) : (
          shots.map((s, i) => (
            <div
              key={s.p.id}
              className={`absolute inset-0 transition-opacity duration-[1100ms] ease-out ${
                i === shot ? "opacity-100" : "opacity-0"
              }`}
            >
              <div className={i === shot && running ? "h-full w-full animate-ken-burns" : "h-full w-full"}>
                <SmartImage
                  src={s.img}
                  alt=""
                  sizes="100vw"
                  className="object-cover"
                />
              </div>
            </div>
          ))
        )}

        {/* Gradación de color: sin esto, una foto de producto sobre fondo
            blanco arruina el ambiente. Con esto, parece metraje corregido. */}
        <div className="absolute inset-0 bg-night/72" />
        <div className="absolute inset-0 bg-gradient-to-t from-night via-night/35 to-night/85" />

        {/* Textura de proyección: líneas finas de escaneo. Sin `mix-blend-mode`
            a propósito — mezclar esta capa con la foto que hace zoom debajo
            obliga a recomponer la sección entera en cada cuadro. */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, rgba(255,255,255,0.55) 0px, rgba(255,255,255,0.55) 1px, transparent 1px, transparent 4px)",
          }}
        />
      </div>

      {/* =========================== INTERFAZ ============================= */}
      <div className="container-content relative flex min-h-[520px] flex-col justify-between py-10 sm:min-h-[640px] sm:py-14">
        {/* Barra superior: nombre de la tienda + indicador de grabación. */}
        <div className="flex items-center justify-between gap-4">
          <span className="font-mono text-[10px] uppercase tracking-widest2 text-ink-soft">
            {storeName || "Titan"} · {t("film.reel")}
          </span>
          <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest2 text-ember-300">
            <span className={`h-2 w-2 rounded-full bg-ember-500 ${running ? "" : "opacity-40"}`} />
            REC
          </span>
        </div>

        {/* Centro: el titular de la toma actual. `key` fuerza que se rearme
            palabra por palabra en cada cambio de toma. */}
        <div className="max-w-3xl py-10">
          <p className="eyebrow text-accent-300">{t("film.eyebrow")}</p>
          <h2 className="headline mt-4 text-4xl text-ink sm:text-5xl lg:text-6xl">
            <Headline
              key={ownVideo ? "video" : shot}
              text={ownVideo ? t("film.line1") : current?.line || ""}
              step={70}
            />
          </h2>

          {/* Si la toma corresponde a un producto real, hay salida a la ficha:
              el reel no es decoración, es un camino a la compra. */}
          {!ownVideo && current && (
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href={`/producto/${current.p.slug}`} className="btn-accent px-7 py-3.5 text-[12px]">
                {t("film.cta")}
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
              <span className="font-mono text-[10.5px] uppercase tracking-widest2 text-ink-soft">
                {current.p.name}
              </span>
            </div>
          )}
        </div>

        {/* Pie: controles de reproducción y barras de progreso por toma. */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setPlaying((v) => !v)}
            aria-label={playing ? t("film.pause") : t("film.play")}
            className="flex h-11 w-11 shrink-0 items-center justify-center border border-line/25 text-ink backdrop-blur-sm transition-all duration-200 hover:border-accent-400 hover:bg-accent-400 hover:text-[#17130a]"
          >
            {playing ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Con video propio se ofrece sonido; el reel generado no tiene audio. */}
          {ownVideo && (
            <button
              onClick={() => setMuted((v) => !v)}
              aria-label={muted ? t("film.unmute") : t("film.mute")}
              className="flex h-11 w-11 shrink-0 items-center justify-center border border-line/25 text-ink backdrop-blur-sm transition-all duration-200 hover:border-accent-400 hover:bg-accent-400 hover:text-[#17130a]"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M11 5 6.5 9H3v6h3.5L11 19z" />
                {muted ? <path d="m16 9 5 6M21 9l-5 6" /> : <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 6a9 9 0 0 1 0 12" />}
              </svg>
            </button>
          )}

          {/* Progreso: una barra por toma, la activa se llena en tiempo real. */}
          {!ownVideo && shots.length > 1 && (
            <div className="flex flex-1 gap-1.5">
              {shots.map((s, i) => (
                <button
                  key={s.p.id}
                  onClick={() => setShot(i)}
                  aria-label={`${t("film.shot")} ${i + 1}`}
                  className="group h-1 flex-1 bg-line/20"
                >
                  <span
                    className="block h-full origin-left bg-accent-400 transition-transform ease-linear"
                    style={{
                      transform: i < shot ? "scaleX(1)" : i === shot ? "scaleX(1)" : "scaleX(0)",
                      transitionDuration: i === shot && running ? `${SHOT_MS}ms` : "0ms",
                      // La barra activa arranca vacía y se llena durante la toma.
                      animation: i === shot && running ? `bar-fill ${SHOT_MS}ms linear both` : "none",
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
