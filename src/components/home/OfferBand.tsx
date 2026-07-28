"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import SmartImage from "@/components/SmartImage";
import Marquee from "@/components/motion/Marquee";
import { useLang } from "@/context/LanguageContext";
import { formatPrice } from "@/lib/format";
import { productImages, isVideo } from "@/lib/images";
import type { Product } from "@/lib/types";

/* ==========================================================================
   OFERTA DEL DÍA
   --------------------------------------------------------------------------
   Urgencia HONESTA. El contador no es un adorno con una fecha inventada: baja
   hasta la medianoche de hoy y se reinicia solo, porque el bloque se titula
   "ofertas de hoy". Si mañana el producto sigue rebajado, sigue siendo cierto.

   Y la sección entera SÓLO existe si hay al menos un producto con `compareAt`
   mayor que el precio. Sin descuentos reales no hay banda de ofertas: un
   contador corriendo sobre precios normales destruye la confianza para siempre.
   ========================================================================== */

function useCountdownToMidnight() {
  const [left, setLeft] = useState<{ h: string; m: string; s: string } | null>(null);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      const ms = Math.max(0, end.getTime() - now.getTime());
      const h = Math.floor(ms / 3_600_000);
      const m = Math.floor((ms % 3_600_000) / 60_000);
      const s = Math.floor((ms % 60_000) / 1000);
      const pad = (n: number) => String(n).padStart(2, "0");
      setLeft({ h: pad(h), m: pad(m), s: pad(s) });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return left;
}

function Digits({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span
        // `key` fuerza el remontaje en cada cambio: el dígito entra deslizando.
        key={value}
        className="tnum flex h-14 w-14 animate-digit-in items-center justify-center border-2 border-ember-500/60 bg-night font-display text-3xl text-ink sm:h-16 sm:w-16 sm:text-4xl"
      >
        {value}
      </span>
      <span className="mt-1.5 font-mono text-[9px] uppercase tracking-widest2 text-ink-muted">
        {label}
      </span>
    </div>
  );
}

export default function OfferBand({ products }: { products: Product[] }) {
  const { t } = useLang();
  const left = useCountdownToMidnight();

  const deals = useMemo(
    () =>
      products
        .filter(
          (p) =>
            Number(p.compareAt) > Number(p.price) && (Number(p.stock) || 0) > 0
        )
        .sort(
          (a, b) =>
            1 - Number(a.price) / Number(a.compareAt) -
            (1 - Number(b.price) / Number(b.compareAt))
        )
        .reverse(),
    [products]
  );

  if (deals.length === 0) return null;

  const star = deals[0];
  const starImg = productImages(star).find((u: string) => !isVideo(u)) || "";
  const starOff = Math.round((1 - Number(star.price) / Number(star.compareAt)) * 100);
  const maxOff = Math.max(
    ...deals.map((p) => Math.round((1 - Number(p.price) / Number(p.compareAt)) * 100))
  );

  return (
    <section className="relative overflow-hidden border-y-2 border-ember-500/30">
      {/* Fondo caliente: brasa que se desplaza despacio bajo el contenido. */}
      <div
        className="absolute inset-0 -z-10 animate-gradient-pan opacity-[0.16]"
        style={{
          background:
            "linear-gradient(115deg, #f04e1e 0%, #f0b92a 35%, #f04e1e 70%, #c93a12 100%)",
          backgroundSize: "260% 260%",
        }}
        aria-hidden="true"
      />

      {/* Cinta superior: repite el descuento máximo real del catálogo. */}
      <div className="border-b border-ember-500/25 bg-ember-600/25 py-2">
        <Marquee speed={26} itemClassName="px-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <span
              key={i}
              className="font-mono text-[10.5px] font-bold uppercase tracking-widest2 text-ember-100"
            >
              {t("offer.ticker", { off: `${maxOff}%` })}
            </span>
          ))}
        </Marquee>
      </div>

      <div className="container-content grid items-center gap-10 py-12 lg:grid-cols-2 lg:py-16">
        {/* --------------------------- El mensaje --------------------------- */}
        <Reveal variant="left">
          <div>
            <p className="eyebrow text-ember-300">{t("offer.eyebrow")}</p>
            <h2 className="headline mt-3 text-4xl text-ink sm:text-6xl">
              {t("offer.heading")}
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-soft">
              {t("offer.sub", { n: deals.length })}
            </p>

            {/* Contador a medianoche. */}
            {left && (
              <div className="mt-8">
                <p className="font-mono text-[10px] uppercase tracking-widest2 text-ember-300">
                  {t("offer.endsIn")}
                </p>
                <div className="mt-3 flex items-start gap-2.5">
                  <Digits value={left.h} label={t("offer.hours")} />
                  <span className="pt-3 font-display text-3xl text-ember-400">:</span>
                  <Digits value={left.m} label={t("offer.minutes")} />
                  <span className="pt-3 font-display text-3xl text-ember-400">:</span>
                  <Digits value={left.s} label={t("offer.seconds")} />
                </div>
              </div>
            )}

            <a href="#productos" className="btn-accent mt-8 px-8 py-4 text-sm">
              {t("offer.cta")}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>
          </div>
        </Reveal>

        {/* ------------------------ El producto estrella -------------------- */}
        <Reveal variant="right" delay={120}>
          <Link
            href={`/producto/${star.slug}`}
            className="group relative block border-2 border-line/85 bg-surface shadow-hard transition-transform duration-300 hover:-translate-y-1"
          >
            <span className="tag absolute left-0 top-0 z-10 bg-ember-500 px-3 py-1.5 text-sm text-white">
              −{starOff}%
            </span>

            <div className="relative aspect-[16/11] w-full overflow-hidden bg-surface-soft">
              {starImg && (
                <SmartImage
                  src={starImg}
                  alt={star.name || ""}
                  sizes="(max-width: 1024px) 92vw, 560px"
                  className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105"
                />
              )}
            </div>

            <div className="flex items-end justify-between gap-4 border-t-2 border-line/85 p-5">
              <div className="min-w-0">
                <p className="font-mono text-[9.5px] uppercase tracking-widest2 text-ink-muted">
                  {star.category}
                </p>
                <p className="mt-1 truncate text-base font-extrabold text-ink">{star.name}</p>
                <p className="tnum mt-1 text-[12px] text-ink-muted line-through">
                  {formatPrice(star.compareAt)}
                </p>
              </div>
              <span className="tnum shrink-0 font-display text-3xl leading-none text-accent-300 sm:text-4xl">
                {formatPrice(star.price)}
              </span>
            </div>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
